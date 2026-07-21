import mongoose from "mongoose";
import RecurringTransaction from "../models/RecurringTransaction.js";
import Transaction from "../models/Transaction.js";
import ApiError from "../utils/ApiError.js";
import * as transactionService from "./transaction.service.js";

const PAYMENT_METHODS = [
  "cash",
  "upi",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "wallet",
  "other",
];

const startOfDayUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const endOfDayUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const clampDayOfMonth = (year, month, day) => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.min(day, lastDay);
};

const deriveScheduleFields = (startDate, frequency, payload = {}) => {
  const start = new Date(startDate);

  if (frequency === "weekly") {
    return {
      dayOfWeek:
        payload.dayOfWeek !== undefined
          ? Number(payload.dayOfWeek)
          : start.getUTCDay(),
    };
  }

  if (frequency === "monthly") {
    return {
      dayOfMonth:
        payload.dayOfMonth !== undefined
          ? Number(payload.dayOfMonth)
          : start.getUTCDate(),
    };
  }

  if (frequency === "yearly") {
    return {
      monthOfYear:
        payload.monthOfYear !== undefined
          ? Number(payload.monthOfYear)
          : start.getUTCMonth() + 1,
      dayOfMonth:
        payload.dayOfMonth !== undefined
          ? Number(payload.dayOfMonth)
          : start.getUTCDate(),
    };
  }

  return {};
};

export const calculateNextRunDate = (fromDate, recurring) => {
  const base = new Date(fromDate);

  switch (recurring.frequency) {
    case "daily":
      base.setUTCDate(base.getUTCDate() + 1);
      return startOfDayUTC(base);

    case "weekly": {
      const next = new Date(base);
      next.setUTCDate(next.getUTCDate() + 7);
      return startOfDayUTC(next);
    }

    case "monthly": {
      const day = recurring.dayOfMonth || base.getUTCDate();
      const year = base.getUTCFullYear();
      const month = base.getUTCMonth() + 1;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const clampedDay = clampDayOfMonth(nextYear, nextMonth - 1, day);
      return startOfDayUTC(new Date(Date.UTC(nextYear, nextMonth - 1, clampedDay)));
    }

    case "yearly": {
      const month = (recurring.monthOfYear || base.getUTCMonth() + 1) - 1;
      const day = recurring.dayOfMonth || base.getUTCDate();
      const year = base.getUTCFullYear() + 1;
      const clampedDay = clampDayOfMonth(year, month, day);
      return startOfDayUTC(new Date(Date.UTC(year, month, clampedDay)));
    }

    default:
      throw new ApiError(400, "Invalid frequency");
  }
};

/**
 * Advance from startDate until the date is on/after reference (usually today).
 */
export const resolveInitialNextRunDate = (recurring, reference = new Date()) => {
  let next = startOfDayUTC(recurring.startDate);
  const ref = startOfDayUTC(reference);
  let guard = 0;

  while (next < ref && guard < 5000) {
    next = calculateNextRunDate(next, recurring);
    guard += 1;
  }

  if (recurring.endDate && next > startOfDayUTC(recurring.endDate)) {
    return null;
  }

  return next;
};

const findOwnedRecurring = async (userId, recurringId) => {
  if (!mongoose.Types.ObjectId.isValid(recurringId)) {
    throw new ApiError(400, "Invalid recurring transaction ID");
  }

  const recurring = await RecurringTransaction.findOne({
    _id: recurringId,
    user: userId,
    isDeleted: false,
  });

  if (!recurring) {
    throw new ApiError(404, "Recurring transaction not found");
  }

  return recurring;
};

const transactionExistsForRun = async (userId, recurringId, runDate) => {
  const start = startOfDayUTC(runDate);
  const end = endOfDayUTC(runDate);

  return Transaction.findOne({
    user: userId,
    recurringTransaction: recurringId,
    isDeleted: false,
    date: { $gte: start, $lte: end },
  });
};

export const createTransactionFromRecurring = async (recurring, runDate) => {
  const existing = await transactionExistsForRun(
    recurring.user,
    recurring._id,
    runDate,
  );

  if (existing) {
    return { transaction: existing, budgetAlert: null, skipped: true };
  }

  const { transaction, budgetAlert } = await transactionService.createTransaction(
    recurring.user,
    {
      type: recurring.type,
      amount: recurring.amount,
      category: recurring.category,
      description: recurring.description || `Recurring: ${recurring.category}`,
      date: runDate,
      paymentMethod: recurring.paymentMethod,
      notes: recurring.notes,
      recurringTransaction: recurring._id,
    },
    { recurring },
  );

  return { transaction, budgetAlert, skipped: false };
};

export const processRecurringItem = async (recurring, asOf = new Date()) => {
  const asOfEnd = endOfDayUTC(asOf);
  const created = [];

  if (!recurring.isActive || recurring.isDeleted) {
    return { recurring, created, skipped: true };
  }

  while (
    recurring.isActive &&
    recurring.nextRunDate &&
    recurring.nextRunDate <= asOfEnd
  ) {
    if (recurring.endDate && recurring.nextRunDate > endOfDayUTC(recurring.endDate)) {
      recurring.isActive = false;
      break;
    }

    const result = await createTransactionFromRecurring(
      recurring,
      recurring.nextRunDate,
    );

    if (!result.skipped) {
      created.push({
        transaction: result.transaction,
        budgetAlert: result.budgetAlert,
      });
    }

    recurring.lastRunDate = recurring.nextRunDate;
    recurring.totalRuns += 1;
    const next = calculateNextRunDate(recurring.nextRunDate, recurring);

    if (recurring.endDate && next > endOfDayUTC(recurring.endDate)) {
      recurring.isActive = false;
      recurring.nextRunDate = next;
      break;
    }

    recurring.nextRunDate = next;
  }

  await recurring.save();
  return { recurring, created, skipped: created.length === 0 };
};

export const processDueRecurringTransactions = async (asOf = new Date()) => {
  const dueItems = await RecurringTransaction.find({
    isActive: true,
    isDeleted: false,
    startDate: { $lte: endOfDayUTC(asOf) },
    nextRunDate: { $lte: endOfDayUTC(asOf) },
  }).sort({ nextRunDate: 1 });

  const summary = {
    processed: 0,
    createdCount: 0,
    items: [],
  };

  for (const item of dueItems) {
    const result = await processRecurringItem(item, asOf);
    summary.processed += 1;
    summary.createdCount += result.created.length;
    summary.items.push({
      recurringId: item._id,
      created: result.created.length,
    });
  }

  return summary;
};

export const createRecurringTransaction = async (userId, payload) => {
  const {
    type,
    amount,
    category,
    description,
    paymentMethod,
    notes,
    frequency,
    startDate,
    endDate,
    isActive,
  } = payload;

  if (!PAYMENT_METHODS.includes(paymentMethod || "upi")) {
    throw new ApiError(400, "Invalid payment method");
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    throw new ApiError(400, "startDate must be a valid date");
  }

  const schedule = deriveScheduleFields(start, frequency, payload);

  const recurring = await RecurringTransaction.create({
    user: userId,
    type,
    amount,
    category: String(category).trim(),
    description: description ?? "",
    paymentMethod: paymentMethod || "upi",
    notes: notes ?? "",
    frequency,
    startDate: startOfDayUTC(start),
    endDate: endDate ? endOfDayUTC(endDate) : null,
    ...schedule,
    isActive: isActive !== false,
    nextRunDate: startOfDayUTC(start),
  });

  recurring.nextRunDate =
    resolveInitialNextRunDate(recurring) || recurring.nextRunDate;

  if (recurring.endDate && recurring.nextRunDate > recurring.endDate) {
    recurring.isActive = false;
  }

  await recurring.save();
  return recurring;
};

export const listRecurringTransactions = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {
    user: userId,
    isDeleted: false,
  };

  if (query.type) filter.type = query.type;
  if (query.frequency) filter.frequency = query.frequency;
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  const [items, total] = await Promise.all([
    RecurringTransaction.find(filter)
      .sort({ nextRunDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RecurringTransaction.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    recurringTransactions: items,
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

export const getRecurringTransactionById = async (userId, recurringId) => {
  return findOwnedRecurring(userId, recurringId);
};

export const updateRecurringTransaction = async (userId, recurringId, payload) => {
  const recurring = await findOwnedRecurring(userId, recurringId);

  const updatable = [
    "type",
    "amount",
    "category",
    "description",
    "paymentMethod",
    "notes",
    "frequency",
    "dayOfWeek",
    "dayOfMonth",
    "monthOfYear",
    "isActive",
  ];

  for (const field of updatable) {
    if (payload[field] !== undefined) {
      recurring[field] = payload[field];
    }
  }

  if (payload.startDate !== undefined) {
    recurring.startDate = startOfDayUTC(new Date(payload.startDate));
  }

  if (payload.endDate !== undefined) {
    recurring.endDate = payload.endDate
      ? endOfDayUTC(new Date(payload.endDate))
      : null;
  }

  if (payload.frequency || payload.startDate) {
    const schedule = deriveScheduleFields(
      recurring.startDate,
      recurring.frequency,
      payload,
    );
    Object.assign(recurring, schedule);
  }

  if (payload.recalculateNextRun) {
    recurring.nextRunDate =
      resolveInitialNextRunDate(recurring) || recurring.nextRunDate;
  }

  if (recurring.endDate && recurring.nextRunDate > recurring.endDate) {
    recurring.isActive = false;
  }

  await recurring.save();
  return recurring;
};

export const deleteRecurringTransaction = async (userId, recurringId) => {
  const recurring = await RecurringTransaction.findOneAndUpdate(
    {
      _id: recurringId,
      user: userId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!recurring) {
    throw new ApiError(404, "Recurring transaction not found");
  }

  return recurring;
};

export const runRecurringNow = async (userId, recurringId) => {
  const recurring = await findOwnedRecurring(userId, recurringId);

  if (!recurring.isActive) {
    throw new ApiError(400, "Recurring transaction is not active");
  }

  const runDate = recurring.nextRunDate || startOfDayUTC(new Date());
  const result = await createTransactionFromRecurring(recurring, runDate);
  const created = [];

  if (!result.skipped) {
    created.push({
      transaction: result.transaction,
      budgetAlert: result.budgetAlert,
    });
  }

  recurring.lastRunDate = runDate;
  recurring.totalRuns += 1;
  recurring.nextRunDate = calculateNextRunDate(runDate, recurring);

  if (recurring.endDate && recurring.nextRunDate > endOfDayUTC(recurring.endDate)) {
    recurring.isActive = false;
  }

  await recurring.save();

  return {
    recurring,
    created,
  };
};

export const toggleRecurringStatus = async (userId, recurringId, isActive) => {
  const recurring = await findOwnedRecurring(userId, recurringId);
  recurring.isActive = Boolean(isActive);

  if (recurring.isActive && !recurring.nextRunDate) {
    recurring.nextRunDate =
      resolveInitialNextRunDate(recurring) || startOfDayUTC(new Date());
  }

  await recurring.save();
  return recurring;
};
