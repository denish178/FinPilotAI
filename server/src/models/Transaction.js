import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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

    date: {
      type: Date,
      default: Date.now,
      index: true,
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

    recurringTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringTransaction",
      default: null,
      index: true,
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

transactionSchema.index({ user: 1, isDeleted: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1 });
transactionSchema.index({ description: "text" });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
