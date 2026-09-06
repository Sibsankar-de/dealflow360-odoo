import amqp, { Channel, ChannelModel } from "amqplib";
import { env } from "../configs/env";
import { createModuleLogger } from "../utils/logger";

const log = createModuleLogger(import.meta.url);

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let channelPromise: Promise<Channel> | null = null;

async function connectWithRetry(
  retries = 10,
  delay = 2000,
): Promise<ChannelModel> {
  if (!env.RABBITMQ_CONNECTION_URI) {
    throw new Error(
      "RABBITMQ_CONNECTION_URI is not defined in environment variables",
    );
  }
  const maskedUri =
    env.RABBITMQ_CONNECTION_URI.match(/(?<=@)[^/]+/)?.[0] ?? "rabbitmq";

  for (let i = 0; i < retries; i++) {
    try {
      log.info(
        `Connecting to RabbitMQ at ${maskedUri} (attempt ${i + 1}/${retries})...`,
      );
      const conn = await amqp.connect(env.RABBITMQ_CONNECTION_URI);
      log.info("Successfully connected to RabbitMQ");
      return conn;
    } catch (err) {
      log.error(
        `Failed to connect to RabbitMQ (attempt ${i + 1}/${retries}): ${err}`,
      );
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed to connect to RabbitMQ after retries");
}

export async function getChannel(): Promise<Channel> {
  if (channel) return channel;
  if (channelPromise) return channelPromise;

  channelPromise = (async () => {
    try {
      if (!connection) {
        connection = await connectWithRetry();

        connection.on("error", (err: Error) => {
          log.error("RabbitMQ connection error: " + err);
          connection = null;
          channel = null;
          channelPromise = null;
        });

        connection.on("close", () => {
          log.warn("RabbitMQ connection closed");
          connection = null;
          channel = null;
          channelPromise = null;
        });
      }

      if (!channel && connection) {
        channel = await connection.createChannel();

        if (channel) {
          channel.on("error", (err: Error) => {
            log.error("RabbitMQ channel error: " + err);
            channel = null;
            channelPromise = null;
          });

          channel.on("close", () => {
            log.warn("RabbitMQ channel closed");
            channel = null;
            channelPromise = null;
          });

          const assertQueueTriplet = async (base: string) => {
            const dlq = `${base}_dlq`;
            const retry = `${base}_retry`;

            // 1. Assert DLQ
            await channel!.assertQueue(dlq, { durable: true });

            // 2. Assert Retry Queue (5s TTL -> routes back to Main on expiry)
            await channel!.assertQueue(retry, {
              durable: true,
              deadLetterExchange: "",
              deadLetterRoutingKey: base,
              messageTtl: 5000,
            });

            // 3. Assert Main Queue (DLX routes to Retry on nack)
            await channel!.assertQueue(base, {
              durable: true,
              deadLetterExchange: "",
              deadLetterRoutingKey: retry,
            });
          };

          // Elasticsearch indexing queue
          await assertQueueTriplet("elasticsearch_queue_v1");

          // Email queue
          await assertQueueTriplet(`${env.RABBITMQ_EMAIL_QUEUE}_v1`);
        }
      }

      if (!channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }

      return channel;
    } catch (error) {
      log.error("Failed to initialize RabbitMQ channel: " + error);
      channelPromise = null;
      throw error;
    }
  })();

  return channelPromise;
}
