import { ZodSchema } from "zod";
import { ApiError } from "./apiErrorHandler";
import { StatusCodes } from "http-status-codes";

export const validateBody = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Validation failed",
      formattedErrors,
    );
  }
  return result.data;
};
