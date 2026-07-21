import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import ApiError from "../utils/ApiError.js";

const getMonthBounds = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
};

const normalizeCategory = (category) => String(category || "").trim();

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolvePeriod = (query = {}, date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = query.year !== undefined ? Number(query.year) : d.getUTCFullYear();
  const month =
    query.month !== undefined ? Number(query.month) : d.getUTCMonth() + 1;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(400, "year must be between 2000 and 2100");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, "month must be between 1 and 12");
  }

  return { year, month };
};

const serializeBudget = (budget) => {
  const doc = budget.toObject ? budget.toObject() : { ...budget };
  const usage = budget.getUsageStatus
    ? budget.getUsageStatus()
    : {
        status: "ok",
        percentage: 0,
        message: "Budget is within limits.",
      };

  return {
    ...doc,
    usage,
  };
};

/**
 * Sum existing expenses for a category in a month (source of truth for spent).
 */
export const calculateCategorySpent = async (userId, category, year, month) => {
  const { start, end } = getMonthBounds(year, month);

  const result = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
        type: "expense",
        category: {
          $regex: `^${escapeRegex(normalizeCategory(category))}$`,
          $options: "i",
        },
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return Number((result[0]?.total || 0).toFixed(2));
};

const refreshBudgetTotals = async (budget) => {
  const spent = await calculateCategorySpent(
    budget.user,
    budget.category,
    budget.year,
    budget.month,
  );

  budget.spent = spent;
  budget.remaining = Number((budget.monthlyLimit - spent).toFixed(2));
  await budget.save();
  return budget;
};

export const createBudget = async (userId, payload) => {
  const category = normalizeCategory(payload.category);
  const monthlyLimit = Number(payload.monthlyLimit);
  const now = new Date();
  const month = payload.month ? Number(payload.month) : now.getUTCMonth() + 1;
  const year = payload.year ? Number(payload.year) : now.getUTCFullYear();

  if (!category) {
    throw new ApiError(400, "Category is required");
  }

  if (!(monthlyLimit > 0)) {
    throw new ApiError(400, "monthlyLimit must be greater than zero");
  }

  const existing = await Budget.findOne({
    user: userId,
    month,
    year,
    isDeleted: false,
    category: {
      $regex: `^${escapeRegex(category)}$`,
      $options: "i",
    },
  });

  if (existing) {
    throw new ApiError(
      409,
      `Budget already exists for ${category} in ${month}/${year}`,
    );
  }

  const spent = await calculateCategorySpent(userId, category, year, month);

  try {
    const budget = await Budget.create({
      user: userId,
      category,
      monthlyLimit,
      spent,
      remaining: Number((monthlyLimit - spent).toFixed(2)),
      month,
      year,
    });

    return serializeBudget(budget);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        `Budget already exists for ${category} in ${month}/${year}`,
      );
    }
    throw error;
  }
};

export const listBudgets = async (userId, query = {}) => {
  const filter = {
    user: userId,
    isDeleted: false,
  };

  if (query.month || query.year) {
    const { month, year } = resolvePeriod(query);
    filter.month = month;
    filter.year = year;
  }

  if (query.category) {
    filter.category = {
      $regex: `^${escapeRegex(normalizeCategory(query.category))}$`,
      $options: "i",
    };
  }

  const budgets = await Budget.find(filter).sort({ year: -1, month: -1, category: 1 });

  return budgets.map((budget) => serializeBudget(budget));
};

export const getBudgetById = async (userId, budgetId) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new ApiError(400, "Invalid budget ID");
  }

  const budget = await Budget.findOne({
    _id: budgetId,
    user: userId,
    isDeleted: false,
  });

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  return serializeBudget(budget);
};

export const updateBudget = async (userId, budgetId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new ApiError(400, "Invalid budget ID");
  }

  const budget = await Budget.findOne({
    _id: budgetId,
    user: userId,
    isDeleted: false,
  });

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  if (payload.category !== undefined) {
    const category = normalizeCategory(payload.category);
    if (!category) {
      throw new ApiError(400, "Category cannot be empty");
    }
    budget.category = category;
  }

  if (payload.monthlyLimit !== undefined) {
    const monthlyLimit = Number(payload.monthlyLimit);
    if (!(monthlyLimit > 0)) {
      throw new ApiError(400, "monthlyLimit must be greater than zero");
    }
    budget.monthlyLimit = monthlyLimit;
  }

  if (payload.month !== undefined) {
    budget.month = Number(payload.month);
  }

  if (payload.year !== undefined) {
    budget.year = Number(payload.year);
  }

  const duplicate = await Budget.findOne({
    _id: { $ne: budget._id },
    user: userId,
    month: budget.month,
    year: budget.year,
    isDeleted: false,
    category: {
      $regex: `^${escapeRegex(budget.category)}$`,
      $options: "i",
    },
  });

  if (duplicate) {
    throw new ApiError(
      409,
      `Budget already exists for ${budget.category} in ${budget.month}/${budget.year}`,
    );
  }

  await refreshBudgetTotals(budget);
  return serializeBudget(budget);
};

export const deleteBudget = async (userId, budgetId) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new ApiError(400, "Invalid budget ID");
  }

  const budget = await Budget.findOneAndUpdate(
    {
      _id: budgetId,
      user: userId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  return budget;
};

/**
 * Find matching budget for an expense and refresh spent from transactions.
 * Returns alert payload for API responses.
 */
export const syncBudgetForExpense = async (userId, expenseLike) => {
  if (!expenseLike || expenseLike.type !== "expense") {
    return null;
  }

  const date = new Date(expenseLike.date || Date.now());
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const category = normalizeCategory(expenseLike.category);

  if (!category) {
    return null;
  }

  const budget = await Budget.findOne({
    user: userId,
    month,
    year,
    isDeleted: false,
    category: {
      $regex: `^${escapeRegex(category)}$`,
      $options: "i",
    },
  });

  if (!budget) {
    return null;
  }

  await refreshBudgetTotals(budget);
  const usage = budget.getUsageStatus();

  return {
    status: usage.status,
    message: usage.message,
    percentage: usage.percentage,
    budget: serializeBudget(budget),
  };
};

/**
 * Sync budgets affected by old and new transaction states (create/update/delete).
 */
export const syncBudgetsForTransactionChange = async (
  userId,
  previousTx = null,
  nextTx = null,
) => {
  const keys = new Map();

  const track = (tx) => {
    if (!tx || tx.type !== "expense") return;
    const date = new Date(tx.date || Date.now());
    const key = `${normalizeCategory(tx.category).toLowerCase()}|${date.getUTCFullYear()}|${date.getUTCMonth() + 1}`;
    keys.set(key, {
      category: tx.category,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      type: "expense",
      date,
    });
  };

  track(previousTx);
  track(nextTx);

  const alerts = [];
  for (const item of keys.values()) {
    const alert = await syncBudgetForExpense(userId, item);
    if (alert) {
      alerts.push(alert);
    }
  }

  // Prefer the "next" transaction's budget alert for response messaging
  if (nextTx?.type === "expense") {
    const date = new Date(nextTx.date || Date.now());
    const match = alerts.find(
      (a) =>
        a.budget.month === date.getUTCMonth() + 1 &&
        a.budget.year === date.getUTCFullYear() &&
        a.budget.category.toLowerCase() ===
          normalizeCategory(nextTx.category).toLowerCase(),
    );
    return match || alerts[0] || null;
  }

  return alerts[0] || null;
};
