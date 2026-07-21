import morgan from "morgan";

const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    skip: (req) => req.url === "/api/health",
  },
);

export default requestLogger;
