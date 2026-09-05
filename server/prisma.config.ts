import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const user = env("DB_USER") || "admin";
const password = env("DB_PASSWORD") || "root";
const host = env("DB_HOST") || "localhost";
const port = env("DB_PORT") || "5432";
const dbName = env("DB_NAME") || "dealflow";

const encodedUser = encodeURIComponent(user);
const encodedPassword = encodeURIComponent(password);

const connectionUrl = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${dbName}?schema=public`;

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: connectionUrl,
  },
});
