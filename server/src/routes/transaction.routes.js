import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  importTransactions,
} from "../controllers/transaction.controller.js";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import {
  createTransactionValidator,
  updateTransactionValidator,
  transactionIdValidator,
  listTransactionsValidator,
  importTransactionItemValidator,
} from "../validators/transaction.validator.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/import",
  importTransactionItemValidator,
  validate,
  importTransactions,
);

router
  .route("/")
  .post(createTransactionValidator, validate, createTransaction)
  .get(listTransactionsValidator, validate, getTransactions);

router
  .route("/:id")
  .get(transactionIdValidator, validate, getTransactionById)
  .put(updateTransactionValidator, validate, updateTransaction)
  .delete(transactionIdValidator, validate, deleteTransaction);

export default router;
