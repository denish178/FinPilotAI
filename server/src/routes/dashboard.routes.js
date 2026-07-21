import { Router } from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import { dashboardPeriodValidator } from "../validators/dashboard.validator.js";
import {
  getOverview,
  getSummary,
  getRecentTransactions,
  getExpenseByCategory,
  getIncomeByCategory,
  getLast6MonthsAnalytics,
  getTopSpendingCategories,
  getDailyExpenseGraph,
  getMonthlyComparison,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(verifyJWT);
router.use(dashboardPeriodValidator, validate);

router.get("/overview", getOverview);
router.get("/summary", getSummary);
router.get("/recent", getRecentTransactions);
router.get("/expense-by-category", getExpenseByCategory);
router.get("/income-by-category", getIncomeByCategory);
router.get("/last-6-months", getLast6MonthsAnalytics);
router.get("/top-spending-categories", getTopSpendingCategories);
router.get("/daily-expense", getDailyExpenseGraph);
router.get("/monthly-comparison", getMonthlyComparison);

export default router;
