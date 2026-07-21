import mongoose from "mongoose";

const GOAL_STATUSES = ["active", "completed", "cancelled", "overdue"];

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    goalName: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target amount must be greater than zero"],
    },

    savedAmount: {
      type: Number,
      default: 0,
      min: [0, "Saved amount cannot be negative"],
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    status: {
      type: String,
      enum: GOAL_STATUSES,
      default: "active",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

goalSchema.index({ user: 1, isDeleted: 1, status: 1, deadline: 1 });
goalSchema.index({ user: 1, goalName: 1 });

goalSchema.methods.getProgress = function () {
  const target = Number(this.targetAmount) || 0;
  const saved = Number(this.savedAmount) || 0;
  const percentage =
    target > 0 ? Number(Math.min((saved / target) * 100, 100).toFixed(2)) : 0;
  const remaining = Number(Math.max(target - saved, 0).toFixed(2));

  return {
    percentage,
    remaining,
    isCompleted: saved >= target && target > 0,
  };
};

goalSchema.methods.refreshStatus = function () {
  const progress = this.getProgress();
  const now = new Date();

  if (this.status === "cancelled") {
    return this.status;
  }

  if (progress.isCompleted) {
    this.status = "completed";
    if (!this.completedAt) {
      this.completedAt = now;
    }
    return this.status;
  }

  // If previously completed but saved dropped below target
  if (this.status === "completed" && !progress.isCompleted) {
    this.completedAt = null;
  }

  if (this.deadline && new Date(this.deadline) < now) {
    this.status = "overdue";
    return this.status;
  }

  this.status = "active";
  this.completedAt = null;
  return this.status;
};

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;
export { GOAL_STATUSES };
