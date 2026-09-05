import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

const parseBoolean = (
  value: string | undefined,
  _default: boolean = false,
): boolean => (value ? value === "true" : _default);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  APP_DEBUG: parseBoolean(process.env.APP_DEBUG, true),

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_USER: process.env.DB_USER || "admin",
  DB_PASSWORD: process.env.DB_PASSWORD || "root",
  DB_NAME: process.env.DB_NAME || "dealflow",
  DB_SSL: parseBoolean(process.env.DB_SSL, false),
} as const;
