import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiErrorHandler";
import { env } from "../configs/env";
import { Prisma } from "@prisma/client";
import { createModuleLogger } from "../utils/logger";

const log = createModuleLogger(import.meta.url);

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let error: ApiError;

  // log the error for debugging
  log.debug(`[API_ERROR]: ${String(err)}`);

  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    error = new ApiError(500, "Internal Server Error", [], err.stack);
  } else if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Error) {
    const customErr = err as Error & {
      statusCode?: number;
      errors?: unknown[];
    };
    error = new ApiError(
      customErr.statusCode || 500,
      customErr.message || "Internal Server Error",
      customErr.errors || [],
      customErr.stack,
    );
  } else {
    error = new ApiError(500, "Internal Server Error");
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors,
    ...(env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};
