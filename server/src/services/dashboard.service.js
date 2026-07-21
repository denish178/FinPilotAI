import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import ApiError from "../utils/ApiError.js";

const toObjectId = (userId) => new mongoose.Types.ObjectId(userId);

const baseMatch = (userId) => ({
  user: toObjectId(userId),
  isDeleted: false,
});

const getMonthBounds = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
};

const parsePeriod = (query = {}) => {
  const now = new Date();
  const year = query.year ? Number(query.year) : now.getUTCFullYear();
  const month = query.month ? Number(query.month) : now.getUTCMonth() + 1;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(400, "year must be a valid year between 2000 and 2100");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, "month must be an integer between 1 and 12");
  }

  return { year, month, ...getMonthBounds(year, month) };
};

/**
 * Totals across all time + current month income/expense + balance.
 */
export const getSummary = async (userId, query = {}) => {
  const { year, month, start, end } = parsePeriod(query);
  const userMatch = baseMatch(userId);

  const [lifetime, monthly] = await Promise.all([
    Transaction.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          ...userMatch,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const pick = (rows, type) =>
    Number(rows.find((r) => r._id === type)?.total || 0);

  const totalIncome = pick(lifetime, "income");
  const totalExpense = pick(lifetime, "expense");
  const monthlyIncome = pick(monthly, "income");
  const monthlyExpense = pick(monthly, "expense");

  return {
    period: { month, year },
    totalIncome,
    totalExpense,
    currentBalance: totalIncome - totalExpense,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance: monthlyIncome - monthlyExpense,
  };
};

/**
 * Most recent non-deleted transactions.
 */
export const getRecentTransactions = async (userId, query = {}) => {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 5));

  const transactions = await Transaction.find(baseMatch(userId))
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .select("-isDeleted -deletedAt -__v")
    .lean();

  return { transactions, count: transactions.length };
};

/**
 * Category breakdown for income or expense within a period.
 */
export const getByCategory = async (userId, type, query = {}) => {
  if (!["income", "expense"].includes(type)) {
    throw new ApiError(400, "type must be income or expense");
  }

  const { year, month, start, end } = parsePeriod(query);

  const rows = await Transaction.aggregate([
    {
      $match: {
        ...baseMatch(userId),
        type,
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        total: { $round: ["$total", 2] },
        count: 1,
      },
    },
  ]);

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return {
    type,
    period: { month, year },
    total: grandTotal,
    categories: rows.map((row) => ({
      ...row,
      percentage:
        grandTotal > 0
          ? Number(((row.total / grandTotal) * 100).toFixed(2))
          : 0,
    })),
  };
};

/**
 * Income vs expense for the last N months (default 6), chart-ready.
 */
export const getLastNMonthsAnalytics = async (userId, query = {}) => {
  const months = Math.min(24, Math.max(1, Number(query.months) || 6));
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
  );

  const rows = await Transaction.aggregate([
    {
      $match: {
        ...baseMatch(userId),
        date: { $gte: start },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const bucket = new Map();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    bucket.set(key, {
      year,
      month,
      label: d.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  for (const row of rows) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const entry = bucket.get(key);
    if (!entry) continue;
    entry[row._id.type] = Number(row.total.toFixed(2));
  }

  const analytics = [...bucket.values()].map((entry) => ({
    ...entry,
    net: Number((entry.income - entry.expense).toFixed(2)),
  }));

  return { months, analytics };
};

/**
 * Top spending categories for a period.
 */
export const getTopSpendingCategories = async (userId, query = {}) => {
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 5));
  const result = await getByCategory(userId, "expense", query);

  return {
    period: result.period,
    categories: result.categories.slice(0, limit),
  };
};

/**
 * Daily expense totals for the last N days (default 30).
 */
export const getDailyExpenseGraph = async (userId, query = {}) => {
  const days = Math.min(90, Math.max(1, Number(query.days) || 30));
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  const rows = await Transaction.aggregate([
    {
      $match: {
        ...baseMatch(userId),
        type: "expense",
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDay = new Map(
    rows.map((row) => [
      row._id,
      { total: Number(row.total.toFixed(2)), count: row.count },
    ]),
  );

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = byDay.get(key) || { total: 0, count: 0 };
    series.push({
      date: key,
      label: d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      total: found.total,
      count: found.count,
    });
  }

  return {
    days,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    series,
  };
};

/**
 * Compare current month vs previous month income/expense.
 */
export const getMonthlyComparison = async (userId, query = {}) => {
  const { year, month, start, end } = parsePeriod(query);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prev = getMonthBounds(prevYear, prevMonth);

  const aggregatePeriod = async (from, to) => {
    const rows = await Transaction.aggregate([
      {
        $match: {
          ...baseMatch(userId),
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const income = Number(rows.find((r) => r._id === "income")?.total || 0);
    const expense = Number(rows.find((r) => r._id === "expense")?.total || 0);

    return {
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      net: Number((income - expense).toFixed(2)),
    };
  };

  const [current, previous] = await Promise.all([
    aggregatePeriod(start, end),
    aggregatePeriod(prev.start, prev.end),
  ]);

  const pctChange = (curr, prevVal) => {
    if (prevVal === 0) return curr === 0 ? 0 : 100;
    return Number((((curr - prevVal) / prevVal) * 100).toFixed(2));
  };

  return {
    current: { year, month, ...current },
    previous: { year: prevYear, month: prevMonth, ...previous },
    change: {
      incomePercent: pctChange(current.income, previous.income),
      expensePercent: pctChange(current.expense, previous.expense),
      netPercent: pctChange(current.net, previous.net),
    },
  };
};

/**
 * Single payload for the main dashboard page (one round-trip).
 */
export const getOverview = async (userId, query = {}) => {
  const [
    summary,
    recent,
    expenseByCategory,
    incomeByCategory,
    last6Months,
    topSpending,
    dailyExpense,
    monthlyComparison,
  ] = await Promise.all([
    getSummary(userId, query),
    getRecentTransactions(userId, { limit: query.recentLimit || 5 }),
    getByCategory(userId, "expense", query),
    getByCategory(userId, "income", query),
    getLastNMonthsAnalytics(userId, { months: 6 }),
    getTopSpendingCategories(userId, { ...query, limit: 5 }),
    getDailyExpenseGraph(userId, { days: query.days || 30 }),
    getMonthlyComparison(userId, query),
  ]);

  return {
    summary,
    recentTransactions: recent.transactions,
    expenseByCategory: expenseByCategory.categories,
    incomeByCategory: incomeByCategory.categories,
    last6Months: last6Months.analytics,
    topSpendingCategories: topSpending.categories,
    dailyExpense: dailyExpense.series,
    monthlyComparison,
  };
};
