import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./configs/env";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ApiResponse } from "./utils/apiResponseHandler";

const app = express();

// Security and header middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());

// Body parsing middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Logging middleware
app.use(morgan("dev"));

// Health check endpoint
app.get("/health", (_req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: "ok" }, "Server is healthy"));
});

// Application API routes
app.use(routes);

// Global error handling middleware
app.use(errorMiddleware);

export { app };
