import mongoose from "mongoose";
import Goal from "../models/Goal.js";
import ApiError from "../utils/ApiError.js";

const serializeGoal = (goal) => {
  const doc = goal.toObject ? goal.toObject() : { ...goal };
  const progress = goal.getProgress
    ? goal.getProgress()
    : { percentage: 0, remaining: 0, isCompleted: false };

  const deadline = doc.deadline ? new Date(doc.deadline) : null;
  const now = new Date();
  const msLeft = deadline ? deadline.getTime() - now.getTime() : null;

  return {
    ...doc,
    progress,
    daysRemaining:
      msLeft === null
        ? null
        : Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
  };
};

const findOwnedGoal = async (userId, goalId) => {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new ApiError(400, "Invalid goal ID");
  }

  const goal = await Goal.findOne({
    _id: goalId,
    user: userId,
    isDeleted: false,
  });

  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }

  return goal;
};

const persistWithStatus = async (goal) => {
  const previousStatus = goal.status;
  goal.refreshStatus();
  await goal.save();
  const serialized = serializeGoal(goal);

  if (previousStatus !== "completed" && goal.status === "completed") {
    const { notifyGoalAchieved } = await import("./notification.service.js");
    await notifyGoalAchieved(goal.user, goal);
  }

  return serialized;
};

export const createGoal = async (userId, payload) => {
  const goalName = String(payload.goalName || "").trim();
  const targetAmount = Number(payload.targetAmount);
  const savedAmount = Number(payload.savedAmount ?? 0);
  const deadline = new Date(payload.deadline);

  if (!goalName) {
    throw new ApiError(400, "goalName is required");
  }

  if (!(targetAmount > 0)) {
    throw new ApiError(400, "targetAmount must be greater than zero");
  }

  if (savedAmount < 0) {
    throw new ApiError(400, "savedAmount cannot be negative");
  }

  if (Number.isNaN(deadline.getTime())) {
    throw new ApiError(400, "deadline must be a valid date");
  }

  if (savedAmount > targetAmount) {
    throw new ApiError(400, "savedAmount cannot exceed targetAmount");
  }

  const goal = new Goal({
    user: userId,
    goalName,
    targetAmount,
    savedAmount,
    deadline,
    description: payload.description ?? "",
    status: payload.status === "cancelled" ? "cancelled" : "active",
  });

  return persistWithStatus(goal);
};

export const listGoals = async (userId, query = {}) => {
  const filter = {
    user: userId,
    isDeleted: false,
  };

  if (query.status) {
    filter.status = query.status;
  }

  const goals = await Goal.find(filter).sort({ deadline: 1, createdAt: -1 });

  const serialized = [];
  for (const goal of goals) {
    const before = goal.status;
    goal.refreshStatus();
    if (goal.status !== before || goal.isModified()) {
      await goal.save();
    }
    serialized.push(serializeGoal(goal));
  }

  return serialized;
};

export const getGoalById = async (userId, goalId) => {
  const goal = await findOwnedGoal(userId, goalId);
  return persistWithStatus(goal);
};

export const updateGoal = async (userId, goalId, payload) => {
  const goal = await findOwnedGoal(userId, goalId);

  if (payload.goalName !== undefined) {
    const goalName = String(payload.goalName).trim();
    if (goalName.length < 2) {
      throw new ApiError(400, "goalName must be at least 2 characters");
    }
    goal.goalName = goalName;
  }

  if (payload.targetAmount !== undefined) {
    const targetAmount = Number(payload.targetAmount);
    if (!(targetAmount > 0)) {
      throw new ApiError(400, "targetAmount must be greater than zero");
    }
    goal.targetAmount = targetAmount;
  }

  if (payload.savedAmount !== undefined) {
    const savedAmount = Number(payload.savedAmount);
    if (savedAmount < 0) {
      throw new ApiError(400, "savedAmount cannot be negative");
    }
    goal.savedAmount = savedAmount;
  }

  if (payload.deadline !== undefined) {
    const deadline = new Date(payload.deadline);
    if (Number.isNaN(deadline.getTime())) {
      throw new ApiError(400, "deadline must be a valid date");
    }
    goal.deadline = deadline;
  }

  if (payload.description !== undefined) {
    goal.description = String(payload.description).trim();
  }

  if (payload.status !== undefined) {
    if (!["active", "completed", "cancelled", "overdue"].includes(payload.status)) {
      throw new ApiError(400, "Invalid status");
    }
    goal.status = payload.status;
    if (payload.status === "completed" && !goal.completedAt) {
      goal.completedAt = new Date();
    }
    if (payload.status !== "completed") {
      // refreshStatus may override cancelled; respect explicit cancelled
      if (payload.status === "cancelled") {
        await goal.save();
        return serializeGoal(goal);
      }
    }
  }

  if (goal.savedAmount > goal.targetAmount) {
    throw new ApiError(400, "savedAmount cannot exceed targetAmount");
  }

  // Explicit completed status should stick if amounts meet target
  if (payload.status === "completed") {
    if (goal.savedAmount < goal.targetAmount) {
      goal.savedAmount = goal.targetAmount;
    }
    goal.status = "completed";
    goal.completedAt = goal.completedAt || new Date();
    return persistWithStatus(goal);
  }

  return persistWithStatus(goal);
};

export const contributeToGoal = async (userId, goalId, amount) => {
  const contribution = Number(amount);

  if (!(contribution > 0)) {
    throw new ApiError(400, "Contribution amount must be greater than zero");
  }

  const goal = await findOwnedGoal(userId, goalId);

  if (goal.status === "cancelled") {
    throw new ApiError(400, "Cannot contribute to a cancelled goal");
  }

  const nextSaved = Number((goal.savedAmount + contribution).toFixed(2));

  if (nextSaved > goal.targetAmount) {
    throw new ApiError(
      400,
      `Contribution exceeds remaining amount of ${Number((goal.targetAmount - goal.savedAmount).toFixed(2))}`,
    );
  }

  goal.savedAmount = nextSaved;
  return persistWithStatus(goal);
};

export const deleteGoal = async (userId, goalId) => {
  const goal = await Goal.findOneAndUpdate(
    {
      _id: goalId,
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

  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }

  return goal;
};

export const getCompletedGoals = async (userId) => {
  const goals = await Goal.find({
    user: userId,
    isDeleted: false,
    status: "completed",
  }).sort({ completedAt: -1, updatedAt: -1 });

  return goals.map((goal) => serializeGoal(goal));
};

/**
 * Upcoming = active goals with future deadlines, soonest first.
 */
export const getUpcomingGoals = async (userId, query = {}) => {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const now = new Date();

  const goals = await Goal.find({
    user: userId,
    isDeleted: false,
    status: { $in: ["active", "overdue"] },
    deadline: { $gte: now },
  })
    .sort({ deadline: 1 })
    .limit(limit);

  const serialized = [];
  for (const goal of goals) {
    goal.refreshStatus();
    if (goal.isModified()) {
      await goal.save();
    }
    if (goal.status === "active") {
      serialized.push(serializeGoal(goal));
    }
  }

  return serialized;
};
