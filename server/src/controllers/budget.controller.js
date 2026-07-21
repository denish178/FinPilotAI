import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as budgetService from "../services/budget.service.js";

export const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.user._id, req.body);

  const message =
    budget.usage?.status === "exceeded"
      ? "Budget created. Existing spending already exceeds the limit."
      : budget.usage?.status === "warning"
        ? "Budget created. Existing spending is above 80% of the limit."
        : "Budget created successfully";

  return res.status(201).json(new ApiResponse(201, budget, message));
});

export const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await budgetService.listBudgets(req.user._id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, { budgets }, "Budgets fetched successfully"));
});

export const getBudgetById = asyncHandler(async (req, res) => {
  const budget = await budgetService.getBudgetById(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, budget, "Budget fetched successfully"));
});

export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.updateBudget(
    req.user._id,
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, budget, "Budget updated successfully"));
});

export const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Budget deleted successfully"));
});
