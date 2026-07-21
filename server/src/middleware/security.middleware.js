import helmet from "helmet";

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
});

const isDangerousKey = (key) => key.startsWith("$") || key.includes(".");

const sanitizeMongoOperators = (input) => {
  if (input === null || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeMongoOperators);
  }

  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => !isDangerousKey(key))
      .map(([key, value]) => [key, sanitizeMongoOperators(value)]),
  );
};

export const sanitizeRequest = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeMongoOperators(req.body);
  }
  next();
};

const SENSITIVE_FIELDS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
]);

const stripXssPatterns = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

const sanitizeXssObject = (input, parentKey = "") => {
  if (typeof input === "string") {
    if (SENSITIVE_FIELDS.has(parentKey)) return input;
    return stripXssPatterns(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeXssObject(item, parentKey));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeXssObject(value, key)]),
    );
  }

  return input;
};

export const xssSanitizer = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeXssObject(req.body);
  }
  next();
};
