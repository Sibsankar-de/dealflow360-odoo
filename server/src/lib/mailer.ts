import nodemailer from "nodemailer";
import { env } from "../configs/env";
import { EmailJob } from "../types/email";
import { createModuleLogger } from "../utils/logger";

import type SMTPTransport from "nodemailer/lib/smtp-transport";

const log = createModuleLogger(import.meta.url);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false,
  },
  ...(env.SMTP_USER && env.SMTP_PASS
    ? {
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {}),
} as SMTPTransport.Options);

export async function sendMail(options: EmailJob) {
  try {
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
    });

    const recipient = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;
    log.info(
      `Email sent successfully to ${recipient}. Message ID: ${info.messageId}`,
    );

    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    const recipient = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;
    log.error(`Failed to send email to ${recipient}: ${error}`);
    throw error;
  }
}
