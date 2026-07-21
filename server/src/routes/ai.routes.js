import { Router } from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import { aiPeriodValidator } from "../validators/ai.validator.js";
import {
  getProviderInfo,
  analyzeSpendingHabits,
  suggestSavings,
  detectUnusualExpenses,
  getMonthlySummary,
  getPersonalizedTips,
  getFullInsights,
} from "../controllers/ai.controller.js";

const router = Router();

router.use(verifyJWT);
router.use(aiPeriodValidator, validate);

router.get("/provider", getProviderInfo);
router.get("/insights", getFullInsights);
router.get("/spending-habits", analyzeSpendingHabits);
router.get("/savings-suggestions", suggestSavings);
router.get("/unusual-expenses", detectUnusualExpenses);
router.get("/monthly-summary", getMonthlySummary);
router.get("/tips", getPersonalizedTips);

export default router;
