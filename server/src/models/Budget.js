import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: 50,
    },

    monthlyLimit: {
      type: Number,
      required: [true, "Monthly limit is required"],
      min: [0, "Monthly limit cannot be negative"],
    },

    spent: {
      type: Number,
      default: 0,
      min: 0,
    },

    remaining: {
      type: Number,
      default: 0,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
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

budgetSchema.index(
  { user: 1, category: 1, month: 1, year: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    collation: { locale: "en", strength: 2 },
  },
);

budgetSchema.pre("validate", function () {
  this.remaining = Number(
    (Number(this.monthlyLimit || 0) - Number(this.spent || 0)).toFixed(2),
  );
});

budgetSchema.methods.getUsageStatus = function () {
  const limit = Number(this.monthlyLimit) || 0;
  const spent = Number(this.spent) || 0;
  const percentage =
    limit > 0 ? Number(((spent / limit) * 100).toFixed(2)) : 0;

  if (limit > 0 && spent >= limit) {
    return {
      status: "exceeded",
      percentage,
      message: `Budget exceeded for ${this.category}. Spent ${spent} of ${limit}.`,
    };
  }

  if (limit > 0 && percentage >= 80) {
    return {
      status: "warning",
      percentage,
      message: `Warning: you have used ${percentage}% of your ${this.category} budget.`,
    };
  }

  return {
    status: "ok",
    percentage,
    message: "Budget is within limits.",
  };
};

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
