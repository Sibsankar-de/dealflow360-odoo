import { Client } from "@elastic/elasticsearch";
import { env } from "../configs/env";
import { createModuleLogger } from "../utils/logger";

const log = createModuleLogger(import.meta.url);

let client: Client | null = null;

export function getElasticsearchClient(): Client {
  if (!client) {
    client = new Client({ node: env.ELASTICSEARCH_URL });
  }
  return client;
}

export async function connectElasticsearch(
  retries = 10,
  delay = 2000,
): Promise<void> {
  const es = getElasticsearchClient();

  for (let i = 0; i < retries; i++) {
    try {
      log.info(
        `Connecting to Elasticsearch at ${env.ELASTICSEARCH_URL} (attempt ${i + 1}/${retries})...`,
      );
      await es.ping();
      log.info("Successfully connected to Elasticsearch");
      await ensureIndices();
      return;
    } catch (err) {
      log.error(
        `Failed to connect to Elasticsearch (attempt ${i + 1}/${retries}): ${err}`,
      );
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function ensureIndices(): Promise<void> {
  const es = getElasticsearchClient();

  const productIndexExists = await es.indices.exists({
    index: env.ELASTICSEARCH_PRODUCTS_INDEX,
  });

  if (!productIndexExists) {
    await es.indices.create({
      index: env.ELASTICSEARCH_PRODUCTS_INDEX,
      mappings: {
        properties: {
          id: { type: "keyword" },
          companyId: { type: "keyword" },
          name: { type: "text", analyzer: "standard" },
          description: { type: "text", analyzer: "standard" },
        },
      },
    });
    log.info(`Index created: ${env.ELASTICSEARCH_PRODUCTS_INDEX}`);
  }

  const userIndexExists = await es.indices.exists({
    index: env.ELASTICSEARCH_USERS_INDEX,
  });

  if (!userIndexExists) {
    await es.indices.create({
      index: env.ELASTICSEARCH_USERS_INDEX,
      mappings: {
        properties: {
          id: { type: "keyword" },
          email: { type: "keyword" },
          name: { type: "text", analyzer: "standard" },
        },
      },
    });
    log.info(`Index created: ${env.ELASTICSEARCH_USERS_INDEX}`);
  }
}
