import mongoose from "mongoose";
import Transaction from "../../../models/Transaction.js";
import Budget from "../../../models/Budget.js";
import Goal from "../../../models/Goal.js";

const toObjectId = (userId) => new mongoose.Types.ObjectId(userId);

const getMonthBounds = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
};

const parsePeriod = (query = {}) => {
  const now = new Date();
  const year = query.year ? Number(query.year) : now.getUTCFullYear();
  const month = query.month ? Number(query.month) : now.getUTCMonth() + 1;
  return { year, month, ...getMonthBounds(year, month) };
};

const baseMatch = (userId) => ({
  user: toObjectId(userId),
  isDeleted: false,
});

const avg = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const stdDev = (values) => {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance =
    values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Gather financial context used by all AI features.
 */
export const gatherFinancialContext = async (userId, query = {}) => {
  const { year, month, start, end } = parsePeriod(query);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prev = getMonthBounds(prevYear, prevMonth);

  const userMatch = baseMatch(userId);

  const [
    monthlyTotals,
    prevTotals,
    categoryBreakdown,
    recentExpenses,
    budgets,
    goals,
    last6Months,
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...userMatch, date: { $gte: start, $lte: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { ...userMatch, date: { $gte: prev.start, $lte: prev.end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          ...userMatch,
          type: "expense",
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Transaction.find({
      ...userMatch,
      type: "expense",
      date: { $gte: start, $lte: end },
    })
      .sort({ date: -1 })
      .limit(100)
      .lean(),
    Budget.find({ user: userId, month, year, isDeleted: false }).lean(),
    Goal.find({ user: userId, isDeleted: false, status: { $ne: "cancelled" } })
      .sort({ deadline: 1 })
      .limit(10)
      .lean(),
    Transaction.aggregate([
      {
        $match: {
          ...userMatch,
          date: {
            $gte: new Date(Date.UTC(year, month - 6, 1)),
          },
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
    ]),
  ]);

  const pick = (rows, type) =>
    Number(rows.find((r) => r._id === type)?.total || 0);

  const monthlyIncome = pick(monthlyTotals, "income");
  const monthlyExpense = pick(monthlyTotals, "expense");
  const prevIncome = pick(prevTotals, "income");
  const prevExpense = pick(prevTotals, "expense");

  return {
    period: { month, year },
    summary: {
      income: monthlyIncome,
      expense: monthlyExpense,
      net: monthlyIncome - monthlyExpense,
      savingsRate:
        monthlyIncome > 0
          ? Number(
              (((monthlyIncome - monthlyExpense) / monthlyIncome) * 100).toFixed(
                2,
              ),
            )
          : 0,
    },
    comparison: {
      incomeChangePercent:
        prevIncome > 0
          ? Number(
              (((monthlyIncome - prevIncome) / prevIncome) * 100).toFixed(2),
            )
          : 0,
      expenseChangePercent:
        prevExpense > 0
          ? Number(
              (((monthlyExpense - prevExpense) / prevExpense) * 100).toFixed(2),
            )
          : 0,
    },
    categoryBreakdown: categoryBreakdown.map((row) => ({
      category: row._id,
      total: Number(row.total.toFixed(2)),
      count: row.count,
      avgAmount: Number(row.avgAmount.toFixed(2)),
      share:
        monthlyExpense > 0
          ? Number(((row.total / monthlyExpense) * 100).toFixed(2))
          : 0,
    })),
    recentExpenses,
    budgets,
    goals,
    last6Months,
  };
};

export const analyzeSpendingHabits = async (userId, query = {}) => {
  const ctx = await gatherFinancialContext(userId, query);

  const topCategories = ctx.categoryBreakdown.slice(0, 5);
  const dominant = topCategories[0];

  const dayOfWeekSpend = {};
  for (const tx of ctx.recentExpenses) {
    const day = new Date(tx.date).getUTCDay();
    dayOfWeekSpend[day] = (dayOfWeekSpend[day] || 0) + tx.amount;
  }

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const peakDay = Object.entries(dayOfWeekSpend).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const insights = [];

  if (dominant) {
    insights.push(
      `${dominant.category} is your top spending category at ${dominant.share}% of monthly expenses (${dominant.total}).`,
    );
  }

  if (ctx.comparison.expenseChangePercent > 10) {
    insights.push(
      `Expenses increased by ${ctx.comparison.expenseChangePercent}% compared to last month.`,
    );
  } else if (ctx.comparison.expenseChangePercent < -10) {
    insights.push(
      `You reduced expenses by ${Math.abs(ctx.comparison.expenseChangePercent)}% compared to last month. Great progress!`,
    );
  }

  if (peakDay) {
    insights.push(
      `You tend to spend most on ${dayNames[Number(peakDay[0])]}s.`,
    );
  }

  if (ctx.summary.savingsRate < 10 && ctx.summary.income > 0) {
    insights.push(
      `Your savings rate is ${ctx.summary.savingsRate}%, which is below the recommended 20%.`,
    );
  }

  return {
    provider: "rule_based",
    period: ctx.period,
    topCategories,
    peakSpendingDay: peakDay
      ? { day: dayNames[Number(peakDay[0])], amount: Number(peakDay[1].toFixed(2)) }
      : null,
    savingsRate: ctx.summary.savingsRate,
    expenseChangePercent: ctx.comparison.expenseChangePercent,
    insights,
    score: Math.min(
      100,
      Math.max(
        0,
        Math.round(
          50 +
            (ctx.summary.savingsRate > 20 ? 20 : ctx.summary.savingsRate) -
            Math.max(0, ctx.comparison.expenseChangePercent / 2),
        ),
      ),
    ),
  };
};

export const suggestSavings = async (userId, query = {}) => {
  const ctx = await gatherFinancialContext(userId, query);
  const suggestions = [];

  for (const cat of ctx.categoryBreakdown.slice(0, 3)) {
    const potential = Math.round(cat.total * 0.15);
    if (potential > 0) {
      suggestions.push({
        category: cat.category,
        currentSpend: cat.total,
        suggestedReduction: potential,
        tip: `Reduce ${cat.category} spending by 15% to save ~${potential} this month.`,
        priority: cat.share > 30 ? "high" : "medium",
      });
    }
  }

  for (const budget of ctx.budgets) {
    const usage =
      budget.monthlyLimit > 0
        ? (budget.spent / budget.monthlyLimit) * 100
        : 0;
    if (usage >= 80) {
      suggestions.push({
        category: budget.category,
        currentSpend: budget.spent,
        suggestedReduction: Math.max(0, budget.spent - budget.monthlyLimit * 0.8),
        tip: `${budget.category} budget is at ${usage.toFixed(0)}%. Cap spending to stay within budget.`,
        priority: usage >= 100 ? "high" : "medium",
      });
    }
  }

  if (ctx.summary.net < 0) {
    suggestions.push({
      category: "Overall",
      currentSpend: ctx.summary.expense,
      suggestedReduction: Math.abs(ctx.summary.net),
      tip: `You are overspending by ${Math.abs(ctx.summary.net)} this month. Review discretionary categories first.`,
      priority: "high",
    });
  }

  const totalPotential = suggestions.reduce(
    (sum, s) => sum + (s.suggestedReduction || 0),
    0,
  );

  return {
    provider: "rule_based",
    period: ctx.period,
    suggestions: suggestions.slice(0, 6),
    totalPotentialSavings: totalPotential,
    message:
      totalPotential > 0
        ? `You could save up to ${totalPotential} this month with targeted cutbacks.`
        : "Your spending looks well-managed. Keep tracking consistently.",
  };
};

export const detectUnusualExpenses = async (userId, query = {}) => {
  const ctx = await gatherFinancialContext(userId, query);
  const thresholdMultiplier = Number(process.env.AI_UNUSUAL_EXPENSE_MULTIPLIER || 2);

  const categoryStats = new Map();
  for (const cat of ctx.categoryBreakdown) {
    categoryStats.set(cat.category, {
      avg: cat.avgAmount,
      stdDev: 0,
      amounts: [],
    });
  }

  for (const tx of ctx.recentExpenses) {
    const stat = categoryStats.get(tx.category);
    if (stat) stat.amounts.push(tx.amount);
  }

  for (const stat of categoryStats.values()) {
    stat.stdDev = stdDev(stat.amounts);
  }

  const unusual = [];

  for (const tx of ctx.recentExpenses) {
    const stat = categoryStats.get(tx.category);
    if (!stat) continue;

    const isUnusual =
      tx.amount > stat.avg * thresholdMultiplier ||
      (stat.stdDev > 0 && tx.amount > stat.avg + stat.stdDev * 2);

    if (isUnusual) {
      unusual.push({
        transactionId: tx._id,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        date: tx.date,
        categoryAverage: Number(stat.avg.toFixed(2)),
        deviationPercent:
          stat.avg > 0
            ? Number((((tx.amount - stat.avg) / stat.avg) * 100).toFixed(2))
            : 100,
        reason:
          tx.amount > stat.avg * thresholdMultiplier
            ? `Amount is ${thresholdMultiplier}x+ the category average`
            : "Statistical outlier in this category",
      });
    }
  }

  unusual.sort((a, b) => b.deviationPercent - a.deviationPercent);

  return {
    provider: "rule_based",
    period: ctx.period,
    unusualExpenses: unusual.slice(0, 10),
    count: unusual.length,
    alertLevel: unusual.length >= 3 ? "high" : unusual.length >= 1 ? "medium" : "low",
    message:
      unusual.length > 0
        ? `Found ${unusual.length} unusual expense(s) this month.`
        : "No unusual spending patterns detected this month.",
  };
};

export const getMonthlySummary = async (userId, query = {}) => {
  const ctx = await gatherFinancialContext(userId, query);
  const habits = await analyzeSpendingHabits(userId, query);

  const narrative = [
    `In ${ctx.period.month}/${ctx.period.year}, you earned ${ctx.summary.income} and spent ${ctx.summary.expense}.`,
    ctx.summary.net >= 0
      ? `You saved ${ctx.summary.net} (${ctx.summary.savingsRate}% savings rate).`
      : `You overspent by ${Math.abs(ctx.summary.net)}.`,
  ];

  if (ctx.categoryBreakdown[0]) {
    narrative.push(
      `Top expense category: ${ctx.categoryBreakdown[0].category} (${ctx.categoryBreakdown[0].total}).`,
    );
  }

  if (habits.insights[0]) {
    narrative.push(habits.insights[0]);
  }

  return {
    provider: "rule_based",
    period: ctx.period,
    summary: ctx.summary,
    comparison: ctx.comparison,
    highlights: habits.insights,
    narrative: narrative.join(" "),
    healthScore: habits.score,
  };
};

export const getPersonalizedTips = async (userId, query = {}) => {
  const ctx = await gatherFinancialContext(userId, query);
  const tips = [];

  if (ctx.summary.savingsRate < 20 && ctx.summary.income > 0) {
    tips.push({
      type: "savings",
      priority: "high",
      tip: "Aim to save at least 20% of income. Start by automating a fixed transfer on payday.",
    });
  }

  if (ctx.categoryBreakdown.length >= 3) {
    const top = ctx.categoryBreakdown[0];
    tips.push({
      type: "spending",
      priority: "medium",
      tip: `${top.category} accounts for ${top.share}% of spending. Set a weekly sub-limit for this category.`,
    });
  }

  for (const goal of ctx.goals.filter((g) => g.status === "active")) {
    const remaining = goal.targetAmount - goal.savedAmount;
    tips.push({
      type: "goal",
      priority: "medium",
      tip: `Goal "${goal.goalName}": ${remaining} left to reach ${goal.targetAmount}. Consider a small weekly contribution.`,
    });
  }

  if (ctx.comparison.expenseChangePercent > 15) {
    tips.push({
      type: "alert",
      priority: "high",
      tip: "Expenses rose sharply this month. Review subscriptions and discretionary purchases.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      type: "general",
      priority: "low",
      tip: "Great job staying on track! Keep logging transactions daily for accurate insights.",
    });
  }

  return {
    provider: "rule_based",
    period: ctx.period,
    tips: tips.slice(0, 8),
    count: tips.length,
  };
};

export const getFullInsights = async (userId, query = {}) => {
  const [spendingHabits, savingsSuggestions, unusualExpenses, monthlySummary, tips] =
    await Promise.all([
      analyzeSpendingHabits(userId, query),
      suggestSavings(userId, query),
      detectUnusualExpenses(userId, query),
      getMonthlySummary(userId, query),
      getPersonalizedTips(userId, query),
    ]);

  return {
    provider: "rule_based",
    period: spendingHabits.period,
    spendingHabits,
    savingsSuggestions,
    unusualExpenses,
    monthlySummary,
    tips,
  };
};

export default {
  analyzeSpendingHabits,
  suggestSavings,
  detectUnusualExpenses,
  getMonthlySummary,
  getPersonalizedTips,
  getFullInsights,
};
