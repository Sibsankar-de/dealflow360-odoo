import { getChannel } from "../lib/rabbit";
import { createModuleLogger } from "../utils/logger";

const log = createModuleLogger(import.meta.url);

export type ElasticsearchJobAction = "index" | "delete";
export type ElasticsearchJobEntity = "product" | "user";

export interface ElasticsearchJob {
  action: ElasticsearchJobAction;
  entity: ElasticsearchJobEntity;
  id: string;
  companyId?: string;
  data?: Record<string, unknown>;
}

export const ES_QUEUE_NAME = "elasticsearch_queue_v1";

export const buildProductIndexDocument = (product: {
  id: string;
  name: string;
  description?: string | null;
  companyId: string;
}): Record<string, unknown> => ({
  id: product.id,
  name: product.name,
  description: product.description ?? "",
  companyId: product.companyId,
});

export const buildUserIndexDocument = (user: {
  id: string;
  userName: string;
  email: string;
}): Record<string, unknown> => ({
  id: user.id,
  name: user.userName,
  email: user.email,
});

export class ElasticsearchPublisherService {
  public async publishJob(job: ElasticsearchJob): Promise<void> {
    try {
      const channel = await getChannel();
      const buffer = Buffer.from(JSON.stringify(job));
      channel.sendToQueue(ES_QUEUE_NAME, buffer, { persistent: true });
      log.info(`[ES Publisher] Queued: ${job.action} ${job.entity}:${job.id}`);
    } catch (err) {
      log.error(`[ES Publisher] Failed to queue job: ${err}`);
    }
  }
}

export const elasticsearchPublisherService =
  new ElasticsearchPublisherService();

export const publishElasticsearchJob = (
  job: ElasticsearchJob,
): Promise<void> => elasticsearchPublisherService.publishJob(job);
