import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as transactionService from "../services/transaction.service.js";
import { migrateUserCategories } from "../services/categoryMigration.service.js";

const buildBudgetAwareResponse = (transaction, budgetAlert, defaultMessage) => {
  const payload = {
    transaction,
    budgetAlert: budgetAlert || null,
  };

  if (!budgetAlert) {
    return { statusCode: 200, message: defaultMessage, data: payload };
  }

  if (budgetAlert.status === "exceeded") {
    return {
      statusCode: 200,
      message: "Budget exceeded",
      data: payload,
    };
  }

  if (budgetAlert.status === "warning") {
    return {
      statusCode: 200,
      message: "Budget warning: spending has exceeded 80% of the limit",
      data: payload,
    };
  }

  return { statusCode: 200, message: defaultMessage, data: payload };
};

export const createTransaction = asyncHandler(async (req, res) => {
  const { transaction, budgetAlert } =
    await transactionService.createTransaction(req.user._id, req.body);

  const result = buildBudgetAwareResponse(
    transaction,
    budgetAlert,
    "Transaction created successfully",
  );

  // Create still uses 201; budget exceeded/warning reflected in message + budgetAlert
  const statusCode = 201;
  let message = result.message;
  if (!budgetAlert) {
    message = "Transaction created successfully";
  } else if (budgetAlert.status === "exceeded") {
    message = "Transaction created. Budget exceeded.";
  } else if (budgetAlert.status === "warning") {
    message = "Transaction created. Budget warning: over 80% used.";
  }

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, result.data, message));
});

export const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.listTransactions(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Transactions fetched successfully"));
});

export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.user._id,
    req.params.id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, transaction, "Transaction fetched successfully"),
    );
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const { transaction, budgetAlert } =
    await transactionService.updateTransaction(
      req.user._id,
      req.params.id,
      req.body,
    );

  const result = buildBudgetAwareResponse(
    transaction,
    budgetAlert,
    "Transaction updated successfully",
  );

  let message = "Transaction updated successfully";
  if (budgetAlert?.status === "exceeded") {
    message = "Transaction updated. Budget exceeded.";
  } else if (budgetAlert?.status === "warning") {
    message = "Transaction updated. Budget warning: over 80% used.";
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result.data, message));
});

export const migrateCategories = asyncHandler(async (req, res) => {
  const summary = await migrateUserCategories(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Legacy categories updated to the current labels",
    ),
  );
});

export const importTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.bulkCreateTransactions(
    req.user._id,
    req.body.transactions,
  );

  const statusCode = result.failedCount > 0 && result.createdCount === 0 ? 400 : 201;
  let message = `${result.createdCount} transaction(s) imported successfully`;

  if (result.failedCount > 0) {
    message =
      result.createdCount > 0
        ? `${result.createdCount} imported, ${result.failedCount} failed`
        : "Import failed for all rows";
  }

  return res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const { budgetAlert } = await transactionService.softDeleteTransaction(
    req.user._id,
    req.params.id,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { budgetAlert: budgetAlert || null },
      "Transaction deleted successfully",
    ),
  );
});
