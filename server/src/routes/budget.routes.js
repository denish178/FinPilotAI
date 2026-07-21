import { Router } from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller.js";
import {
  createBudgetValidator,
  updateBudgetValidator,
  budgetIdValidator,
  listBudgetsValidator,
} from "../validators/budget.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .post(createBudgetValidator, validate, createBudget)
  .get(listBudgetsValidator, validate, getBudgets);

router
  .route("/:id")
  .get(budgetIdValidator, validate, getBudgetById)
  .put(updateBudgetValidator, validate, updateBudget)
  .delete(budgetIdValidator, validate, deleteBudget);

export default router;
