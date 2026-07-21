import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(new ApiError(400, "Validation failed", formattedErrors));
  }

  next();
};

export default validate;
