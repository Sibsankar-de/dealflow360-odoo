import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  InvoiceResponse,
  InvoiceSummaryResponse,
  ListInvoicesQuery,
  RecordInvoicePaymentPayload,
  CreateInvoicePayload,
} from "@/types/invoice";

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<
      ApiResponse<{
        docs: InvoiceResponse[];
        totalDocs?: number;
        total?: number;
        page: number;
        limit?: number;
        totalPages: number;
      }>,
      { companyId?: string; params?: ListInvoicesQuery } | void
    >({
      query: (arg) => {
        const companyId = arg && typeof arg === "object" ? arg.companyId : undefined;
        const params = arg && typeof arg === "object" ? arg.params : undefined;
        return {
          url: companyId ? `/invoices/${companyId}` : "/invoices",
          method: "GET",
          params,
        };
      },
      providesTags: ["Invoice"],
    }),

    getInvoiceById: builder.query<
      ApiResponse<{ invoice: InvoiceResponse }>,
      { companyId?: string; id: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        const companyId = typeof arg === "object" ? arg.companyId : undefined;
        return {
          url: companyId ? `/invoices/${companyId}/${id}` : `/invoices/${id}`,
          method: "GET",
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: "Invoice", id: typeof arg === "string" ? arg : arg.id },
      ],
    }),

    getInvoiceSummary: builder.query<
      ApiResponse<InvoiceSummaryResponse>,
      { companyId: string }
    >({
      query: ({ companyId }) => ({
        url: `/invoices/${companyId}/summary`,
        method: "GET",
      }),
      providesTags: ["Invoice"],
    }),

    createInvoice: builder.mutation<
      ApiResponse<{ invoice: InvoiceResponse }>,
      { companyId: string; data: CreateInvoicePayload }
    >({
      query: ({ companyId, data }) => ({
        url: `/invoices/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Invoice", "Quotation"],
    }),

    recordInvoicePayment: builder.mutation<
      ApiResponse<{ invoice: InvoiceResponse }>,
      { companyId: string; invoiceId: string; data: RecordInvoicePaymentPayload }
    >({
      query: ({ companyId, invoiceId, data }) => ({
        url: `/invoices/${companyId}/${invoiceId}/pay`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        "Invoice",
        { type: "Invoice", id: invoiceId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceSummaryQuery,
  useCreateInvoiceMutation,
  useRecordInvoicePaymentMutation,
} = invoiceApi;
