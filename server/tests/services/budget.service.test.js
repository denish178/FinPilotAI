import { createBudget, listBudgets } from "../../src/services/budget.service.js";
import { createTransaction } from "../../src/services/transaction.service.js";
import { createTestUser } from "../helpers/testFactory.js";
import ApiError from "../../src/utils/ApiError.js";

describe("Budget Service", () => {
  let userId;
  const now = new Date();

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user._id;
  });

  it("should create a budget for a category", async () => {
    const budget = await createBudget(userId, {
      category: "Food",
      monthlyLimit: 5000,
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
    });

    expect(budget.category).toBe("Food");
    expect(budget.monthlyLimit).toBe(5000);
    expect(budget.spent).toBe(0);
  });

  it("should sync spent amount from expenses", async () => {
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    await createBudget(userId, {
      category: "Food",
      monthlyLimit: 5000,
      month,
      year,
    });

    await createTransaction(
      userId,
      {
        type: "expense",
        amount: 800,
        category: "Food",
        date: new Date(Date.UTC(year, month - 1, 10)),
      },
      { skipNotifications: true },
    );

    const budgets = await listBudgets(userId, { month, year });
    expect(budgets[0].spent).toBe(800);
    expect(budgets[0].remaining).toBe(4200);
  });

  it("should prevent duplicate budget for same category and month", async () => {
    const payload = {
      category: "Transport",
      monthlyLimit: 2000,
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
    };

    await createBudget(userId, payload);

    await expect(createBudget(userId, payload)).rejects.toThrow(ApiError);
  });
});
