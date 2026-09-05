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
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_USER: process.env.DB_USER || "admin",
  DB_PASSWORD: process.env.DB_PASSWORD || "root",
  DB_NAME: process.env.DB_NAME || "dealflow",
  DB_SSL: parseBoolean(process.env.DB_SSL, false),

  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret_key",
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: Number(process.env.REFRESH_TOKEN_EXPIRY || 10),

  ACCESS_TOKEN_COOKIE_EXPIRY: Number(
    process.env.ACCESS_TOKEN_COOKIE_EXPIRY || 15,
  ),
  REFRESH_TOKEN_COOKIE_EXPIRY: Number(
    process.env.REFRESH_TOKEN_COOKIE_EXPIRY || 10,
  ),

  RABBITMQ_CONNECTION_URI:
    process.env.RABBITMQ_CONNECTION_URI || "amqp://admin:admin@localhost:5672",

  ELASTICSEARCH_URL:
    process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  ELASTICSEARCH_PRODUCTS_INDEX:
    process.env.ELASTICSEARCH_PRODUCTS_INDEX || "dealflow_products",
  ELASTICSEARCH_USERS_INDEX:
    process.env.ELASTICSEARCH_USERS_INDEX || "dealflow_users",
} as const;
