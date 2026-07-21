import mongoose from "mongoose";
import {
  buildTransactionFilter,
  createTransaction,
  listTransactions,
  softDeleteTransaction,
} from "../../src/services/transaction.service.js";
import { createTestUser } from "../helpers/testFactory.js";
import ApiError from "../../src/utils/ApiError.js";

describe("Transaction Service", () => {
  let userId;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user._id;
  });

  describe("buildTransactionFilter", () => {
    it("should build base filter for user", () => {
      const filter = buildTransactionFilter(userId, {});
      expect(filter.user).toEqual(userId);
      expect(filter.isDeleted).toBe(false);
    });

    it("should include type and search filters", () => {
      const filter = buildTransactionFilter(userId, {
        type: "expense",
        search: "coffee",
      });
      expect(filter.type).toBe("expense");
      expect(filter.description.$regex).toBe("coffee");
    });
  });

  describe("createTransaction", () => {
    it("should create an expense transaction", async () => {
      const { transaction } = await createTransaction(userId, {
        type: "expense",
        amount: 250,
        category: "Food",
        description: "Lunch",
      });

      expect(transaction.amount).toBe(250);
      expect(transaction.type).toBe("expense");
      expect(transaction.user.toString()).toBe(userId.toString());
    });
  });

  describe("listTransactions", () => {
    it("should paginate and filter transactions", async () => {
      await createTransaction(userId, {
        type: "expense",
        amount: 100,
        category: "Food",
        description: "Breakfast",
      });
      await createTransaction(userId, {
        type: "income",
        amount: 5000,
        category: "Salary",
        description: "Paycheck",
      });

      const result = await listTransactions(userId, {
        type: "expense",
        page: 1,
        limit: 10,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe("expense");
      expect(result.pagination.total).toBe(1);
    });

    it("should reject invalid amount range", async () => {
      await expect(
        listTransactions(userId, { minAmount: 500, maxAmount: 100 }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe("softDeleteTransaction", () => {
    it("should soft delete a transaction", async () => {
      const { transaction } = await createTransaction(userId, {
        type: "expense",
        amount: 50,
        category: "Transport",
      });

      await softDeleteTransaction(userId, transaction._id);

      const result = await listTransactions(userId, {});
      expect(result.transactions).toHaveLength(0);
    });

    it("should throw for invalid id", async () => {
      await expect(
        softDeleteTransaction(userId, new mongoose.Types.ObjectId()),
      ).rejects.toThrow(ApiError);
    });
  });
});
