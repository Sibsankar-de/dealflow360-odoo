import http from "http";
import { app } from "./app";
import { env } from "./configs/env";
import { connectDB } from "./lib/prisma";
import { createModuleLogger } from "./utils/logger";

const log = createModuleLogger(import.meta.url);

const httpServer = http.createServer(app);

connectDB()
  .then(() => {
    httpServer.listen(env.PORT, () => {
      log.info(`Server is running on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    log.error(`Failed to connect to database: ${err}`);
  });

httpServer.on("error", (error: Error) => {
  log.error(`Server error: ${error.message}`);
  throw error;
});
