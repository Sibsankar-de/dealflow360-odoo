import { emailTemplates } from "../constants/emailTemplates";
import { renderEmail } from "./emailRender.service";
import { EmailJob } from "../types/email";
import { clientPages } from "../constants/client.constant";

export interface QuotationSentCustomerData {
  customerName: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  dealTitle: string;
  totalAmount: number | string;
  currency: string;
  validUntil?: string | Date | null;
  itemsCount?: number;
  salesRepName?: string;
  salesRepEmail?: string;
}

export const getQuotationSentCustomerEmail = async (
  data: QuotationSentCustomerData,
): Promise<EmailJob> => {
  const reviewLink = clientPages.constructCustomerQuotationUrl(
    data.companyId,
    data.dealId,
    data.quotationId,
  );

  const formattedValidUntil = data.validUntil
    ? new Date(data.validUntil).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Upon agreement";

  const templateData = {
    customerName: data.customerName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    validUntil: formattedValidUntil,
    itemsCount: data.itemsCount || 1,
    salesRepName: data.salesRepName || "Sales Representative",
    salesRepEmail: data.salesRepEmail || "",
    reviewLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_SENT_CUSTOMER_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.customerEmail,
    subject: `[${data.companyName}] New Quotation ${data.quotationNo} is Ready for Your Review`,
    html: body,
  };
};

export interface QuotationApprovalRequiredData {
  managerName: string;
  managerEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  dealTitle: string;
  customerName: string;
  salesRepName: string;
  totalAmount: number | string;
  currency: string;
  maxViolation?: number | string;
  blendedViolation?: number | string;
  riskLevel?: string;
}

export const getQuotationApprovalRequiredEmail = async (
  data: QuotationApprovalRequiredData,
): Promise<EmailJob> => {
  const approvalLink = clientPages.constructWorkspaceQuotationUrl(
    data.companyId,
    data.dealId,
    data.quotationId,
  );

  const templateData = {
    managerName: data.managerName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    customerName: data.customerName,
    salesRepName: data.salesRepName,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    maxViolation: data.maxViolation ? Number(data.maxViolation).toFixed(1) : "0",
    blendedViolation: data.blendedViolation
      ? Number(data.blendedViolation).toFixed(1)
      : "0",
    riskLevel: data.riskLevel || "MID",
    approvalLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_APPROVAL_REQUIRED_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.managerEmail,
    subject: `[Approval Required] Quotation ${data.quotationNo} Requires Manager Review (${data.companyName})`,
    html: body,
  };
};

export interface QuotationFinanceEscalationData {
  managerName: string;
  managerEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  dealTitle: string;
  customerName: string;
  salesRepName: string;
  totalAmount: number | string;
  currency: string;
  violationScore?: number | string;
  riskLevel?: string;
  reason?: string;
}

export const getQuotationFinanceEscalationEmail = async (
  data: QuotationFinanceEscalationData,
): Promise<EmailJob> => {
  const reviewLink = clientPages.constructWorkspaceQuotationUrl(
    data.companyId,
    data.dealId,
    data.quotationId,
  );

  const templateData = {
    managerName: data.managerName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    customerName: data.customerName,
    salesRepName: data.salesRepName,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    violationScore: data.violationScore
      ? Number(data.violationScore).toFixed(1)
      : "High",
    riskLevel: data.riskLevel || "HIGH",
    reason:
      data.reason ||
      "Quotation discount exceeds maximum policy threshold and requires financial clearance.",
    reviewLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_FINANCE_ESCALATION_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.managerEmail,
    subject: `🚨 [High Risk Alert] Quotation ${data.quotationNo} Escalated for Finance Review (${data.companyName})`,
    html: body,
  };
};

export interface CustomerNegotiationSubmittedData {
  recipientName: string;
  recipientEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  dealTitle: string;
  customerName: string;
  proposedAmount?: number | string;
  currency: string;
  reason?: string;
}

export const getCustomerNegotiationSubmittedEmail = async (
  data: CustomerNegotiationSubmittedData,
): Promise<EmailJob> => {
  const negotiationLink = clientPages.constructWorkspaceQuotationUrl(
    data.companyId,
    data.dealId,
    data.quotationId,
  );

  const templateData = {
    recipientName: data.recipientName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    customerName: data.customerName,
    proposedAmount: data.proposedAmount
      ? Number(data.proposedAmount).toFixed(2)
      : "Custom proposal",
    currency: data.currency || "USD",
    reason: data.reason || "Customer submitted a counter-proposal / comments.",
    negotiationLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_NEGOTIATION_SUBMITTED_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.recipientEmail,
    subject: `💬 [Negotiation Request] ${data.customerName} Requested Changes on Quotation ${data.quotationNo}`,
    html: body,
  };
};

export interface QuotationRevisedData {
  customerName: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  revisionNo: number;
  dealTitle: string;
  totalAmount: number | string;
  currency: string;
  validUntil?: string | Date | null;
  notes?: string;
}

export const getQuotationRevisedEmail = async (
  data: QuotationRevisedData,
): Promise<EmailJob> => {
  const reviewLink = clientPages.constructCustomerQuotationUrl(
    data.companyId,
    data.dealId,
    data.quotationId,
  );

  const formattedValidUntil = data.validUntil
    ? new Date(data.validUntil).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Upon agreement";

  const templateData = {
    customerName: data.customerName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    revisionNo: data.revisionNo,
    dealTitle: data.dealTitle,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    validUntil: formattedValidUntil,
    notes: data.notes || "We have updated the terms based on our discussion.",
    reviewLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_REVISED_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.customerEmail,
    subject: `[${data.companyName}] Revised Quotation ${data.quotationNo} (Revision #${data.revisionNo})`,
    html: body,
  };
};

export interface QuotationAcceptedCustomerData {
  customerName: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  quotationNo: string;
  dealTitle: string;
  totalAmount: number | string;
  currency: string;
}

export const getQuotationAcceptedCustomerEmail = async (
  data: QuotationAcceptedCustomerData,
): Promise<EmailJob> => {
  const portalLink = clientPages.constructCustomerPortalUrl(data.companyId);

  const templateData = {
    customerName: data.customerName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    portalLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_ACCEPTED_CUSTOMER_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.customerEmail,
    subject: `✅ [${data.companyName}] Quotation ${data.quotationNo} Confirmed & Accepted`,
    html: body,
  };
};

export interface QuotationStatusUpdateStaffData {
  recipientName: string;
  recipientEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  dealTitle: string;
  customerName: string;
  status: "ACCEPTED" | "REJECTED" | "CANCELLED";
  reason?: string;
}

export const getQuotationStatusUpdateStaffEmail = async (
  data: QuotationStatusUpdateStaffData,
): Promise<EmailJob> => {
  const dealLink = clientPages.constructWorkspaceQuotationUrl(
    data.companyId,
    data.dealId,
    data.quotationId,
  );

  const isAccepted = data.status === "ACCEPTED";
  const icon = isAccepted ? "✅" : "❌";

  const templateData = {
    recipientName: data.recipientName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    customerName: data.customerName,
    status: data.status,
    isAccepted,
    reason: data.reason || "",
    dealLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.QUOTATION_STATUS_UPDATE_STAFF_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.recipientEmail,
    subject: `${icon} [Quotation ${data.status}] ${data.quotationNo} - ${data.customerName}`,
    html: body,
  };
};

export interface FulfillmentReadyData {
  managerName: string;
  managerEmail: string;
  companyName: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  quotationNo: string;
  dealTitle: string;
  customerName: string;
  salesRepName: string;
  totalAmount: number | string;
  currency: string;
}

export const getFulfillmentReadyEmail = async (
  data: FulfillmentReadyData,
): Promise<EmailJob> => {
  const fulfillmentLink = clientPages.constructWorkspaceFulfillmentUrl(
    data.companyId,
  );

  const templateData = {
    managerName: data.managerName,
    companyName: data.companyName,
    quotationNo: data.quotationNo,
    dealTitle: data.dealTitle,
    customerName: data.customerName,
    salesRepName: data.salesRepName,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    fulfillmentLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.FULFILLMENT_READY_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.managerEmail,
    subject: `📦 [Fulfillment Ready] Quotation ${data.quotationNo} Ready for Fulfillment & Invoicing`,
    html: body,
  };
};

export interface DeliveryDispatchedData {
  customerName: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  deliveryNo: string;
  quotationNo: string;
  trackingReference?: string;
  status?: string;
  deliveredItemsCount: number;
  isPartial?: boolean;
}

export const getDeliveryDispatchedEmail = async (
  data: DeliveryDispatchedData,
): Promise<EmailJob> => {
  const portalLink = clientPages.constructCustomerDealsUrl(data.companyId);

  const templateData = {
    customerName: data.customerName,
    companyName: data.companyName,
    deliveryNo: data.deliveryNo,
    quotationNo: data.quotationNo,
    trackingReference: data.trackingReference || "Standard Dispatch",
    status: data.status || "DISPATCHED",
    deliveredItemsCount: data.deliveredItemsCount,
    isPartial: Boolean(data.isPartial),
    portalLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.DELIVERY_DISPATCHED_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.customerEmail,
    subject: `🚚 [${data.companyName}] Delivery #${data.deliveryNo} Dispatched for Quotation ${data.quotationNo}`,
    html: body,
  };
};

export interface InvoiceGeneratedData {
  customerName: string;
  customerEmail: string;
  companyName: string;
  companyId: string;
  invoiceNo: string;
  quotationNo: string;
  totalAmount: number | string;
  currency: string;
  dueDate?: string | Date | null;
  status?: string;
}

export const getInvoiceGeneratedEmail = async (
  data: InvoiceGeneratedData,
): Promise<EmailJob> => {
  const invoiceLink = clientPages.constructCustomerInvoicesUrl(data.companyId);

  const formattedDueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Upon Receipt";

  const templateData = {
    customerName: data.customerName,
    companyName: data.companyName,
    invoiceNo: data.invoiceNo,
    quotationNo: data.quotationNo,
    totalAmount: Number(data.totalAmount).toFixed(2),
    currency: data.currency || "USD",
    dueDate: formattedDueDate,
    status: data.status || "PENDING",
    invoiceLink,
  };

  const body = await renderEmail({
    templateName: emailTemplates.INVOICE_GENERATED_TEMPLATE,
    data: templateData,
  });

  return {
    to: data.customerEmail,
    subject: `📄 [${data.companyName}] Invoice #${data.invoiceNo} Issued for Quotation ${data.quotationNo}`,
    html: body,
  };
};
