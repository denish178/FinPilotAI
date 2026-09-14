import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import RecurringTransaction from "../models/RecurringTransaction.js";
import { LEGACY_CATEGORY_MAP } from "../constants/categoryMigration.js";

export const migrateUserCategories = async (userId) => {
  const summary = {
    transactionsUpdated: 0,
    recurringUpdated: 0,
    budgetsUpdated: 0,
    budgetsMerged: 0,
  };

  for (const [fromCategory, toCategory] of Object.entries(LEGACY_CATEGORY_MAP)) {
    if (fromCategory === toCategory) continue;

    const txResult = await Transaction.updateMany(
      { user: userId, isDeleted: false, category: fromCategory },
      { $set: { category: toCategory } },
    );
    summary.transactionsUpdated += txResult.modifiedCount;

    const recurringResult = await RecurringTransaction.updateMany(
      { user: userId, isDeleted: false, category: fromCategory },
      { $set: { category: toCategory } },
    );
    summary.recurringUpdated += recurringResult.modifiedCount;

    const legacyBudgets = await Budget.find({
      user: userId,
      isDeleted: false,
      category: fromCategory,
    });

    for (const budget of legacyBudgets) {
      const existing = await Budget.findOne({
        user: userId,
        isDeleted: false,
        category: toCategory,
        month: budget.month,
        year: budget.year,
      });

      if (existing && String(existing._id) !== String(budget._id)) {
        existing.monthlyLimit = Number(
          (
            Number(existing.monthlyLimit || 0) +
            Number(budget.monthlyLimit || 0)
          ).toFixed(2),
        );
        existing.spent = Number(
          (Number(existing.spent || 0) + Number(budget.spent || 0)).toFixed(2),
        );
        await existing.save();

        budget.isDeleted = true;
        budget.deletedAt = new Date();
        await budget.save();
        summary.budgetsMerged += 1;
      } else {
        budget.category = toCategory;
        await budget.save();
        summary.budgetsUpdated += 1;
      }
    }
  }

  return summary;
};
