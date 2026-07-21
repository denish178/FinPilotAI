import { Router } from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import {
  createGoal,
  getGoals,
  getCompletedGoals,
  getUpcomingGoals,
  getGoalById,
  updateGoal,
  contributeToGoal,
  deleteGoal,
} from "../controllers/goal.controller.js";
import {
  createGoalValidator,
  updateGoalValidator,
  contributeGoalValidator,
  goalIdValidator,
  listGoalsValidator,
} from "../validators/goal.validator.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .post(createGoalValidator, validate, createGoal)
  .get(listGoalsValidator, validate, getGoals);

router.get("/completed", getCompletedGoals);
router.get("/upcoming", listGoalsValidator, validate, getUpcomingGoals);

router.post(
  "/:id/contribute",
  contributeGoalValidator,
  validate,
  contributeToGoal,
);

router
  .route("/:id")
  .get(goalIdValidator, validate, getGoalById)
  .put(updateGoalValidator, validate, updateGoal)
  .delete(goalIdValidator, validate, deleteGoal);

export default router;
