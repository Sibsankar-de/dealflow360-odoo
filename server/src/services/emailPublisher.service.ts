import { env } from "../configs/env";
import { sendMail } from "../lib/mailer";
import { getChannel } from "../lib/rabbit";
import { EmailJob } from "../types/email";
import { createModuleLogger } from "../utils/logger";

const log = createModuleLogger(import.meta.url);

const MAIN_QUEUE = `${env.RABBITMQ_EMAIL_QUEUE}_v1`;
const DLQ = `${MAIN_QUEUE}_dlq`;

export async function publishEmailJob(job: EmailJob): Promise<void> {
  try {
    const channel = await getChannel();
    const buffer = Buffer.from(JSON.stringify(job));

    channel.sendToQueue(MAIN_QUEUE, buffer, {
      persistent: true,
    });

    const recipient = Array.isArray(job.to) ? job.to.join(", ") : job.to;
    log.info(`[Email Publisher] Queued email to ${recipient} | Subject: "${job.subject}"`);
  } catch (error) {
    log.error(`[Email Publisher] Failed to queue email: ${error}`);
    throw error;
  }
}

export async function startEmailWorker(): Promise<void> {
  const channel = await getChannel();

  // Control concurrency
  channel.prefetch(5);

  log.info("Email worker consumer started...");

  channel.consume(
    MAIN_QUEUE,
    async (msg) => {
      if (!msg) return;

      let job: EmailJob | null = null;
      try {
        job = JSON.parse(msg.content.toString()) as EmailJob;

        if (job) {
          await sendMail(job);
          channel.ack(msg);

          const recipient = Array.isArray(job.to) ? job.to.join(", ") : job.to;
          log.info(`[Email Consumer] Successfully sent email to: ${recipient}`);
        }
      } catch (err) {
        const recipient = job?.to
          ? Array.isArray(job.to)
            ? job.to.join(", ")
            : job.to
          : "unknown";
        log.error(`[Email Consumer] Email sending failed to ${recipient}: ${err}`);

        // Check retry count in headers
        const xDeath = msg.properties.headers?.["x-death"];
        let retryCount = 0;
        if (xDeath && Array.isArray(xDeath)) {
          const mainQueueEntry = (
            xDeath as Array<{ queue?: string; count?: number }>
          ).find((entry) => entry.queue === MAIN_QUEUE);
          if (mainQueueEntry && typeof mainQueueEntry.count === "number") {
            retryCount = mainQueueEntry.count;
          }
        }

        if (retryCount < env.EMAIL_RETRY_COUNT) {
          log.warn(
            `[Email Consumer] Nacking email for ${recipient} to retry (attempt ${retryCount + 1}/${env.EMAIL_RETRY_COUNT})...`,
          );
          // Nack with requeue=false. DLX routes to retry queue
          channel.nack(msg, false, false);
        } else {
          log.error(
            `[Email Consumer] Email sending failed after ${env.EMAIL_RETRY_COUNT} retries for ${recipient}. Sending to DLQ.`,
          );

          // Publish message directly to DLQ
          channel.sendToQueue(DLQ, msg.content, {
            persistent: true,
            headers: {
              ...msg.properties.headers,
              "x-original-error": String(err),
              "x-retry-limit-exceeded": true,
            },
          });

          // Acknowledge the message so it is removed from the main queue
          channel.ack(msg);
        }
      }
    },
    { noAck: false },
  );
}
