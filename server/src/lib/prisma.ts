import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg, { PoolConfig } from "pg";
import { createModuleLogger } from "../utils/logger";
import { env } from "../configs/env";

const log = createModuleLogger(import.meta.url);

const pool_conf: PoolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: false,
};

if (env.DB_SSL) {
  pool_conf.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new pg.Pool(pool_conf);

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const connectDB = async () => {
  try {
    // Under driver adapters, PrismaClient connects lazily. Query SELECT 1 to verify.
    await prisma.$queryRaw`SELECT 1`;
    log.info(
      "[PostgreSQL] Connected via PrismaPg adapter using separate pool parameters",
    );
  } catch (error) {
    log.error("[PostgreSQL] Connection failed via PrismaPg adapter");
    throw error;
  }
};
