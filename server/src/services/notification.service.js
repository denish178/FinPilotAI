import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";

const LARGE_EXPENSE_THRESHOLD = Number(
  process.env.LARGE_EXPENSE_THRESHOLD || 5000,
);

const startOfDayUTC = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const wasRecentlyNotified = async (userId, type, entityId, hours = 24) => {
  if (!entityId) return false;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const existing = await Notification.findOne({
    user: userId,
    type,
    entityId,
    createdAt: { $gte: since },
  }).select("_id");

  return Boolean(existing);
};

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  priority = "medium",
  metadata = {},
  entityType = null,
  entityId = null,
  skipDedup = false,
}) => {
  if (!skipDedup && entityId) {
    const duplicate = await wasRecentlyNotified(userId, type, entityId);
    if (duplicate) {
      return null;
    }
  }

  return Notification.create({
    user: userId,
    type,
    title,
    message,
    priority,
    metadata,
    entityType,
    entityId,
  });
};

export const notifyBudgetExceeded = async (userId, budgetAlert, transaction) => {
  if (budgetAlert?.status !== "exceeded") {
    return null;
  }

  const budget = budgetAlert.budget;
  const entityId = budget._id;

  return createNotification({
    userId,
    type: "budget_exceeded",
    title: "Budget exceeded",
    message: `You exceeded your ${budget.category} budget. Spent ${budget.spent} of ${budget.monthlyLimit}.`,
    priority: "high",
    metadata: {
      category: budget.category,
      spent: budget.spent,
      monthlyLimit: budget.monthlyLimit,
      percentage: budgetAlert.percentage,
      month: budget.month,
      year: budget.year,
      transactionId: transaction?._id || null,
    },
    entityType: "Budget",
    entityId,
  });
};

export const notifyGoalAchieved = async (userId, goal) => {
  return createNotification({
    userId,
    type: "goal_achieved",
    title: "Goal achieved!",
    message: `Congratulations! You reached your "${goal.goalName}" goal of ${goal.targetAmount}.`,
    priority: "medium",
    metadata: {
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      completedAt: goal.completedAt,
    },
    entityType: "Goal",
    entityId: goal._id,
  });
};

export const notifyLargeExpense = async (userId, transaction) => {
  if (transaction.type !== "expense") {
    return null;
  }

  if (Number(transaction.amount) < LARGE_EXPENSE_THRESHOLD) {
    return null;
  }

  return createNotification({
    userId,
    type: "large_expense",
    title: "Large expense detected",
    message: `A large expense of ${transaction.amount} was recorded in ${transaction.category}${transaction.description ? `: ${transaction.description}` : ""}.`,
    priority: "high",
    metadata: {
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      threshold: LARGE_EXPENSE_THRESHOLD,
    },
    entityType: "Transaction",
    entityId: transaction._id,
  });
};

export const notifyRecurringPayment = async (
  userId,
  recurring,
  transaction,
) => {
  const label =
    recurring.type === "income" ? "Recurring income received" : "Recurring payment processed";

  return createNotification({
    userId,
    type: "recurring_payment",
    title: label,
    message: `${recurring.description || recurring.category}: ${recurring.amount} (${recurring.frequency}).`,
    priority: "low",
    metadata: {
      recurringId: recurring._id,
      transactionId: transaction._id,
      amount: recurring.amount,
      category: recurring.category,
      frequency: recurring.frequency,
      type: recurring.type,
    },
    entityType: "RecurringTransaction",
    entityId: recurring._id,
    skipDedup: false,
  });
};

/**
 * Central handler after a transaction is created.
 */
export const handleTransactionNotifications = async (
  userId,
  transaction,
  budgetAlert = null,
  options = {},
) => {
  const notifications = [];

  if (transaction.type === "expense") {
    const large = await notifyLargeExpense(userId, transaction);
    if (large) notifications.push(large);
  }

  if (budgetAlert?.status === "exceeded") {
    const budget = await notifyBudgetExceeded(userId, budgetAlert, transaction);
    if (budget) notifications.push(budget);
  }

  if (options.recurring) {
    const recurring = await notifyRecurringPayment(
      userId,
      options.recurring,
      transaction,
    );
    if (recurring) notifications.push(recurring);
  }

  return notifications;
};

export const listNotifications = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: userId };

  if (query.isRead === "true") {
    filter.isRead = true;
  } else if (query.isRead === "false") {
    filter.isRead = false;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    notifications,
    unreadCount,
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

export const getUnreadNotifications = async (userId, query = {}) => {
  return listNotifications(userId, { ...query, isRead: "false" });
};

export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  return { unreadCount: count };
};

export const markAsRead = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};

export const deleteNotification = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};
