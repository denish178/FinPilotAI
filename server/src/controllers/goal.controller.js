import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as goalService from "../services/goal.service.js";

export const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user._id, req.body);

  const message = goal.progress?.isCompleted
    ? "Goal created and already completed"
    : "Goal created successfully";

  return res.status(201).json(new ApiResponse(201, goal, message));
});

export const getGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.listGoals(req.user._id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, { goals }, "Goals fetched successfully"));
});

export const getCompletedGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getCompletedGoals(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { goals }, "Completed goals fetched successfully"),
    );
});

export const getUpcomingGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getUpcomingGoals(req.user._id, req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { goals }, "Upcoming goals fetched successfully"),
    );
});

export const getGoalById = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, goal, "Goal fetched successfully"));
});

export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(
    req.user._id,
    req.params.id,
    req.body,
  );

  const message = goal.progress?.isCompleted
    ? "Goal updated and marked completed"
    : "Goal updated successfully";

  return res.status(200).json(new ApiResponse(200, goal, message));
});

export const contributeToGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.contributeToGoal(
    req.user._id,
    req.params.id,
    req.body.amount,
  );

  const message = goal.progress?.isCompleted
    ? "Contribution added. Goal achieved!"
    : "Contribution added successfully";

  return res.status(200).json(new ApiResponse(200, goal, message));
});

export const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Goal deleted successfully"));
});
