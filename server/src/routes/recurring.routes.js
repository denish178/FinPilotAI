import { Router } from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  runRecurringNow,
  toggleRecurringStatus,
  processDueRecurring,
} from "../controllers/recurring.controller.js";
import {
  createRecurringValidator,
  updateRecurringValidator,
  recurringIdValidator,
  listRecurringValidator,
  toggleRecurringValidator,
} from "../validators/recurring.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .post(createRecurringValidator, validate, createRecurringTransaction)
  .get(listRecurringValidator, validate, getRecurringTransactions);

router.post("/process-due", processDueRecurring);

router.post(
  "/:id/toggle",
  toggleRecurringValidator,
  validate,
  toggleRecurringStatus,
);

router.post("/:id/run-now", recurringIdValidator, validate, runRecurringNow);

router
  .route("/:id")
  .get(recurringIdValidator, validate, getRecurringTransactionById)
  .put(updateRecurringValidator, validate, updateRecurringTransaction)
  .delete(recurringIdValidator, validate, deleteRecurringTransaction);

export default router;
