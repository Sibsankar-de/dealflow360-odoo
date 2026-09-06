import http from "http";
import { app } from "./app";
import { env } from "./configs/env";
import { connectDB } from "./lib/prisma";
import { createModuleLogger } from "./utils/logger";

import { connectElasticsearch } from "./lib/elasticsearch";
import { startElasticsearchWorker } from "./services/elasticsearchWorker.service";
import { startEmailWorker } from "./services/emailPublisher.service";

const log = createModuleLogger(import.meta.url);

const httpServer = http.createServer(app);

connectDB()
  .then(() => {
    httpServer.listen(env.PORT, () => {
      log.info(`Server is running on port ${env.PORT}`);
    });

    // Start RabbitMQ Email worker consumer
    startEmailWorker().catch((err) => {
      log.error("Failed to start Email worker: " + err);
    });

    // Connect to Elasticsearch and start the indexing worker
    connectElasticsearch()
      .then(() => {
        startElasticsearchWorker().catch((err) => {
          log.error("Failed to start Elasticsearch worker: " + err);
        });
      })
      .catch((err) => {
        log.warn(
          "Elasticsearch unavailable at startup, search will fall back to database: " +
            err,
        );
      });
  })
  .catch((err) => {
    log.error(`Failed to connect to database: ${err}`);
  });

httpServer.on("error", (error: Error) => {
  log.error(`Server error: ${error.message}`);
  throw error;
});
