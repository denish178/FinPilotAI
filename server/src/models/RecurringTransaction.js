import mongoose from "mongoose";

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "upi",
        "credit_card",
        "debit_card",
        "bank_transfer",
        "wallet",
        "other",
      ],
      default: "upi",
    },

    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },

    frequency: {
      type: String,
      enum: FREQUENCIES,
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    nextRunDate: {
      type: Date,
      required: true,
      index: true,
    },

    lastRunDate: {
      type: Date,
      default: null,
    },

    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
    },

    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },

    monthOfYear: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    totalRuns: {
      type: Number,
      default: 0,
      min: 0,
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

recurringTransactionSchema.index({ user: 1, isDeleted: 1, isActive: 1 });
recurringTransactionSchema.index({ isActive: 1, isDeleted: 1, nextRunDate: 1 });

const RecurringTransaction = mongoose.model(
  "RecurringTransaction",
  recurringTransactionSchema,
);

export default RecurringTransaction;
export { FREQUENCIES };
