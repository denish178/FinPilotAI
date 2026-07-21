import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as recurringService from "../services/recurring.service.js";

export const createRecurringTransaction = asyncHandler(async (req, res) => {
  const recurring = await recurringService.createRecurringTransaction(
    req.user._id,
    req.body,
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        recurring,
        "Recurring transaction created successfully",
      ),
    );
});

export const getRecurringTransactions = asyncHandler(async (req, res) => {
  const result = await recurringService.listRecurringTransactions(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Recurring transactions fetched successfully",
      ),
    );
});

export const getRecurringTransactionById = asyncHandler(async (req, res) => {
  const recurring = await recurringService.getRecurringTransactionById(
    req.user._id,
    req.params.id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        recurring,
        "Recurring transaction fetched successfully",
      ),
    );
});

export const updateRecurringTransaction = asyncHandler(async (req, res) => {
  const recurring = await recurringService.updateRecurringTransaction(
    req.user._id,
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        recurring,
        "Recurring transaction updated successfully",
      ),
    );
});

export const deleteRecurringTransaction = asyncHandler(async (req, res) => {
  await recurringService.deleteRecurringTransaction(
    req.user._id,
    req.params.id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Recurring transaction deleted successfully"),
    );
});

export const runRecurringNow = asyncHandler(async (req, res) => {
  const result = await recurringService.runRecurringNow(
    req.user._id,
    req.params.id,
  );

  const message =
    result.created.length > 0
      ? "Recurring transaction processed and transaction(s) created"
      : "Recurring transaction processed (no new transaction created)";

  return res.status(200).json(new ApiResponse(200, result, message));
});

export const toggleRecurringStatus = asyncHandler(async (req, res) => {
  const recurring = await recurringService.toggleRecurringStatus(
    req.user._id,
    req.params.id,
    req.body.isActive,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        recurring,
        `Recurring transaction ${recurring.isActive ? "activated" : "paused"}`,
      ),
    );
});

export const processDueRecurring = asyncHandler(async (req, res) => {
  const summary = await recurringService.processDueRecurringTransactions(
    new Date(),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        summary,
        "Due recurring transactions processed successfully",
      ),
    );
});
