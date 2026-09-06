import { env } from "../configs/env";

export const clientAssets = {
  APP_NAME: "DealFlow360",
  LOGO_FULL: "https://dealflow360.com/images/logo.png",
  SUPPORT_EMAIL: "support@dealflow360.com",
} as const;

export const clientPages = {
  constructCustomerQuotationUrl: (
    companyId: string,
    dealId: string,
    quotationId: string,
  ): string =>
    `${env.CLIENT_URL}/company/${companyId}/customer/deals/${dealId}/quotations/${quotationId}`,

  constructCustomerDealsUrl: (companyId: string): string =>
    `${env.CLIENT_URL}/company/${companyId}/customer/deals`,

  constructCustomerInvoicesUrl: (companyId: string): string =>
    `${env.CLIENT_URL}/company/${companyId}/customer/invoices`,

  constructCustomerSubscriptionsUrl: (companyId: string): string =>
    `${env.CLIENT_URL}/company/${companyId}/customer/subscriptions`,

  constructCustomerPortalUrl: (companyId: string): string =>
    `${env.CLIENT_URL}/company/${companyId}/customer`,

  constructWorkspaceQuotationUrl: (
    companyId: string,
    dealId: string,
    quotationId: string,
  ): string =>
    `${env.CLIENT_URL}/company/${companyId}/workspace/deals/${dealId}/quotations/${quotationId}`,

  constructWorkspaceDealUrl: (companyId: string, dealId: string): string =>
    `${env.CLIENT_URL}/company/${companyId}/workspace/deals/${dealId}`,

  constructWorkspaceFulfillmentUrl: (
    companyId: string,
    fulfillmentId?: string,
  ): string =>
    `${env.CLIENT_URL}/company/${companyId}/workspace/fulfillment${fulfillmentId ? `/${fulfillmentId}` : ""}`,

  constructWorkspaceInvoicesUrl: (
    companyId: string,
    invoiceId?: string,
  ): string =>
    `${env.CLIENT_URL}/company/${companyId}/workspace/invoices${invoiceId ? `/${invoiceId}` : ""}`,

  constructWorkspaceBackordersUrl: (
    companyId: string,
    backorderId?: string,
  ): string =>
    `${env.CLIENT_URL}/company/${companyId}/workspace/backorders${backorderId ? `/${backorderId}` : ""}`,

  constructWorkspaceDashboardUrl: (companyId: string): string =>
    `${env.CLIENT_URL}/company/${companyId}/workspace/dashboard`,

  constructLoginUrl: (): string => `${env.CLIENT_URL}/login`,
};
