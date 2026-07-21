import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as dashboardService from "../services/dashboard.service.js";

export const getOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.user._id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Dashboard overview fetched successfully"));
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user._id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Dashboard summary fetched successfully"));
});

export const getRecentTransactions = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentTransactions(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Recent transactions fetched successfully"));
});

export const getExpenseByCategory = asyncHandler(async (req, res) => {
  const data = await dashboardService.getByCategory(
    req.user._id,
    "expense",
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Expense by category fetched successfully"),
    );
});

export const getIncomeByCategory = asyncHandler(async (req, res) => {
  const data = await dashboardService.getByCategory(
    req.user._id,
    "income",
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Income by category fetched successfully"),
    );
});

export const getLast6MonthsAnalytics = asyncHandler(async (req, res) => {
  const data = await dashboardService.getLastNMonthsAnalytics(req.user._id, {
    months: req.query.months || 6,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Last months analytics fetched successfully"),
    );
});

export const getTopSpendingCategories = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopSpendingCategories(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Top spending categories fetched successfully"),
    );
});

export const getDailyExpenseGraph = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDailyExpenseGraph(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Daily expense graph fetched successfully"),
    );
});

export const getMonthlyComparison = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyComparison(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Monthly comparison fetched successfully"),
    );
});
