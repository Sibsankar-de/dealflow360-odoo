import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  QuotationResponse,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationItemDetail,
  QuotationRevisionDetail,
} from "@/types/quotation";

export interface ListQuotationsQuery {
  page?: number;
  limit?: number;
  dealId?: string;
  customerId?: string;
  salesRepId?: string;
  status?: string;
  search?: string;
}

export const quotationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query<
      ApiResponse<{ docs: QuotationResponse[]; total: number; page: number; totalPages: number }>,
      { companyId?: string; params?: ListQuotationsQuery }
    >({
      query: ({ companyId, params }) => ({
        url: "/quotations",
        method: "GET",
        params: {
          ...params,
          ...(companyId ? { companyId } : {}),
        },
      }),
      providesTags: ["Quotation"],
    }),

    getQuotationById: builder.query<
      ApiResponse<{ quotation: QuotationResponse }>,
      string
    >({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Quotation", id }],
    }),

    createQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { companyId: string; data: CreateQuotationRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/quotations/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Quotation", "Deal"],
    }),

    updateQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { id: string; data: UpdateQuotationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/quotations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    sendQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      string
    >({
      query: (id) => ({
        url: `/quotations/${id}/send`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    addQuotationItem: builder.mutation<
      ApiResponse<{ item: QuotationItemDetail }>,
      { quotationId: string; productId: string; quantity: number }
    >({
      query: ({ quotationId, productId, quantity }) => ({
        url: `/quotations/${quotationId}/items`,
        method: "POST",
        body: { productId, quantity },
      }),
      invalidatesTags: (_result, _error, { quotationId }) => [
        "Quotation",
        { type: "Quotation", id: quotationId },
      ],
    }),

    removeQuotationItem: builder.mutation<
      ApiResponse<{ success: boolean; message: string }>,
      { quotationId: string; itemId: string }
    >({
      query: ({ quotationId, itemId }) => ({
        url: `/quotations/${quotationId}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { quotationId }) => [
        "Quotation",
        { type: "Quotation", id: quotationId },
      ],
    }),

    cancelQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/cancel`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    rejectQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/reject`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    createRevision: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { quotationId: string; data: Record<string, unknown> }
    >({
      query: ({ quotationId, data }) => ({
        url: `/quotations/${quotationId}/revisions`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { quotationId }) => [
        "Quotation",
        { type: "Quotation", id: quotationId },
        "Deal",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useSendQuotationMutation,
  useAddQuotationItemMutation,
  useRemoveQuotationItemMutation,
  useCancelQuotationMutation,
  useRejectQuotationMutation,
  useCreateRevisionMutation,
} = quotationApi;
