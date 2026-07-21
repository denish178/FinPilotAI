import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import ApiError from "../utils/ApiError.js";

const ALLOWED_UPDATE_FIELDS = [
  "type",
  "amount",
  "category",
  "description",
  "date",
  "paymentMethod",
  "notes",
];

/**
 * Build MongoDB filter from query params (scoped to authenticated user).
 */
export const buildTransactionFilter = (userId, query = {}) => {
  const filter = {
    user: userId,
    isDeleted: false,
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.category) {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, "i");
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod;
  }

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      filter.date.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    filter.amount = {};
    if (query.minAmount !== undefined) {
      filter.amount.$gte = Number(query.minAmount);
    }
    if (query.maxAmount !== undefined) {
      filter.amount.$lte = Number(query.maxAmount);
    }
  }

  if (query.search?.trim()) {
    filter.description = {
      $regex: escapeRegex(query.search.trim()),
      $options: "i",
    };
  }

  return filter;
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * List transactions with pagination, sorting, and filters.
 */
export const listTransactions = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "date";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder, _id: -1 };

  const filter = buildTransactionFilter(userId, query);

  if (
    filter.amount?.$gte !== undefined &&
    filter.amount?.$lte !== undefined &&
    filter.amount.$gte > filter.amount.$lte
  ) {
    throw new ApiError(400, "minAmount cannot be greater than maxAmount");
  }

  if (
    filter.date?.$gte &&
    filter.date?.$lte &&
    filter.date.$gte > filter.date.$lte
  ) {
    throw new ApiError(400, "startDate cannot be after endDate");
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get a single non-deleted transaction owned by the user.
 */
export const getTransactionById = async (userId, transactionId) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new ApiError(400, "Invalid transaction ID");
  }

  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    isDeleted: false,
  }).lean();

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return transaction;
};

/**
 * Create a new transaction and sync matching budget for expenses.
 */
export const createTransaction = async (userId, payload, options = {}) => {
  const { syncBudgetsForTransactionChange } = await import(
    "./budget.service.js"
  );

  const transaction = await Transaction.create({
    user: userId,
    type: payload.type,
    amount: payload.amount,
    category: payload.category,
    description: payload.description ?? "",
    date: payload.date || Date.now(),
    paymentMethod: payload.paymentMethod || "upi",
    notes: payload.notes ?? "",
    recurringTransaction: payload.recurringTransaction || null,
  });

  const budgetAlert = await syncBudgetsForTransactionChange(
    userId,
    null,
    transaction,
  );

  if (!options.skipNotifications) {
    const { handleTransactionNotifications } = await import(
      "./notification.service.js"
    );
    await handleTransactionNotifications(
      userId,
      transaction,
      budgetAlert,
      options,
    );
  }

  return { transaction, budgetAlert };
};

/**
 * Update an existing transaction (partial update) and sync budgets.
 */
export const updateTransaction = async (userId, transactionId, payload) => {
  const { syncBudgetsForTransactionChange } = await import(
    "./budget.service.js"
  );

  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new ApiError(400, "Invalid transaction ID");
  }

  const previous = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    isDeleted: false,
  });

  if (!previous) {
    throw new ApiError(404, "Transaction not found");
  }

  const updates = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      user: userId,
      isDeleted: false,
    },
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  );

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  const budgetAlert = await syncBudgetsForTransactionChange(
    userId,
    previous,
    transaction,
  );

  return { transaction, budgetAlert };
};

/**
 * Soft-delete a transaction and sync budgets.
 */
export const softDeleteTransaction = async (userId, transactionId) => {
  const { syncBudgetsForTransactionChange } = await import(
    "./budget.service.js"
  );

  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new ApiError(400, "Invalid transaction ID");
  }

  const previous = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    isDeleted: false,
  });

  if (!previous) {
    throw new ApiError(404, "Transaction not found");
  }

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
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

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  const budgetAlert = await syncBudgetsForTransactionChange(
    userId,
    previous,
    null,
  );

  return { transaction, budgetAlert };
};

/**
 * Bulk-create transactions (CSV import). Skips per-row notifications for performance.
 */
export const bulkCreateTransactions = async (userId, items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "No transactions provided for import");
  }

  if (items.length > 500) {
    throw new ApiError(400, "Cannot import more than 500 transactions at once");
  }

  const created = [];
  const failed = [];
  const budgetAlerts = [];

  for (let index = 0; index < items.length; index += 1) {
    try {
      const { transaction, budgetAlert } = await createTransaction(
        userId,
        items[index],
        { skipNotifications: true },
      );
      created.push(transaction);
      if (budgetAlert) {
        budgetAlerts.push({ index, category: items[index].category, ...budgetAlert });
      }
    } catch (error) {
      failed.push({
        index,
        row: index + 1,
        message: error.message || "Failed to import transaction",
      });
    }
  }

  return {
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed,
    budgetAlerts,
  };
};
