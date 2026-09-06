import {
  getQuotationSentCustomerEmail,
  QuotationSentCustomerData,
  getQuotationApprovalRequiredEmail,
  QuotationApprovalRequiredData,
  getQuotationFinanceEscalationEmail,
  QuotationFinanceEscalationData,
  getCustomerNegotiationSubmittedEmail,
  CustomerNegotiationSubmittedData,
  getQuotationRevisedEmail,
  QuotationRevisedData,
  getQuotationAcceptedCustomerEmail,
  QuotationAcceptedCustomerData,
  getQuotationStatusUpdateStaffEmail,
  QuotationStatusUpdateStaffData,
  getFulfillmentReadyEmail,
  FulfillmentReadyData,
  getDeliveryDispatchedEmail,
  DeliveryDispatchedData,
  getInvoiceGeneratedEmail,
  InvoiceGeneratedData,
} from "./email.service";
import { publishEmailJob } from "./emailPublisher.service";
import { createModuleLogger } from "../utils/logger";

const log = createModuleLogger(import.meta.url);

export const sendQuotationSentToCustomerEmail = async (
  data: QuotationSentCustomerData,
): Promise<void> => {
  if (!data.customerEmail) return;
  try {
    const job = await getQuotationSentCustomerEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(`Failed to send quotation sent email to customer: ${error}`);
  }
};

export const sendQuotationApprovalRequiredEmail = async (
  data: QuotationApprovalRequiredData,
): Promise<void> => {
  if (!data.managerEmail) return;
  try {
    const job = await getQuotationApprovalRequiredEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send manager approval required email to ${data.managerEmail}: ${error}`,
    );
  }
};

export const sendQuotationFinanceEscalationEmail = async (
  data: QuotationFinanceEscalationData,
): Promise<void> => {
  if (!data.managerEmail) return;
  try {
    const job = await getQuotationFinanceEscalationEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send finance escalation email to ${data.managerEmail}: ${error}`,
    );
  }
};

export const sendCustomerNegotiationSubmittedEmail = async (
  data: CustomerNegotiationSubmittedData,
): Promise<void> => {
  if (!data.recipientEmail) return;
  try {
    const job = await getCustomerNegotiationSubmittedEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send negotiation submitted email to ${data.recipientEmail}: ${error}`,
    );
  }
};

export const sendQuotationRevisedEmail = async (
  data: QuotationRevisedData,
): Promise<void> => {
  if (!data.customerEmail) return;
  try {
    const job = await getQuotationRevisedEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send quotation revised email to customer ${data.customerEmail}: ${error}`,
    );
  }
};

export const sendQuotationAcceptedCustomerEmail = async (
  data: QuotationAcceptedCustomerData,
): Promise<void> => {
  if (!data.customerEmail) return;
  try {
    const job = await getQuotationAcceptedCustomerEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send quotation accepted email to customer ${data.customerEmail}: ${error}`,
    );
  }
};

export const sendQuotationStatusUpdateStaffEmail = async (
  data: QuotationStatusUpdateStaffData,
): Promise<void> => {
  if (!data.recipientEmail) return;
  try {
    const job = await getQuotationStatusUpdateStaffEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send quotation status update email to ${data.recipientEmail}: ${error}`,
    );
  }
};

export const sendFulfillmentReadyEmail = async (
  data: FulfillmentReadyData,
): Promise<void> => {
  if (!data.managerEmail) return;
  try {
    const job = await getFulfillmentReadyEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send fulfillment ready email to ${data.managerEmail}: ${error}`,
    );
  }
};

export const sendDeliveryDispatchedEmail = async (
  data: DeliveryDispatchedData,
): Promise<void> => {
  if (!data.customerEmail) return;
  try {
    const job = await getDeliveryDispatchedEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send delivery dispatched email to ${data.customerEmail}: ${error}`,
    );
  }
};

export const sendInvoiceGeneratedEmail = async (
  data: InvoiceGeneratedData,
): Promise<void> => {
  if (!data.customerEmail) return;
  try {
    const job = await getInvoiceGeneratedEmail(data);
    await publishEmailJob(job);
  } catch (error) {
    log.error(
      `Failed to send invoice generated email to ${data.customerEmail}: ${error}`,
    );
  }
};
