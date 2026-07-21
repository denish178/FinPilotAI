import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as aiService from "../services/ai.service.js";

export const getProviderInfo = asyncHandler(async (req, res) => {
  const info = aiService.getProviderInfo();

  return res
    .status(200)
    .json(new ApiResponse(200, info, "AI provider info fetched successfully"));
});

export const analyzeSpendingHabits = asyncHandler(async (req, res) => {
  const data = await aiService.analyzeSpendingHabits(req.user._id, req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Spending habits analyzed successfully"),
    );
});

export const suggestSavings = asyncHandler(async (req, res) => {
  const data = await aiService.suggestSavings(req.user._id, req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Savings suggestions generated successfully"),
    );
});

export const detectUnusualExpenses = asyncHandler(async (req, res) => {
  const data = await aiService.detectUnusualExpenses(req.user._id, req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Unusual expenses detected successfully"),
    );
});

export const getMonthlySummary = asyncHandler(async (req, res) => {
  const data = await aiService.getMonthlySummary(req.user._id, req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Monthly financial summary generated successfully"),
    );
});

export const getPersonalizedTips = asyncHandler(async (req, res) => {
  const data = await aiService.getPersonalizedTips(req.user._id, req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Personalized tips generated successfully"),
    );
});

export const getFullInsights = asyncHandler(async (req, res) => {
  const data = await aiService.getFullInsights(req.user._id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Full AI insights generated successfully"));
});
