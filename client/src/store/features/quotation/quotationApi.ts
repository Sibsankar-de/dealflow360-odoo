import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  QuotationResponse,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationItemDetail,
  QuotationRevisionDetail,
  NegotiationDetail,
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
      { companyId?: string; id: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        const companyId = typeof arg === "object" ? arg.companyId : undefined;
        return {
          url: companyId ? `/quotations/${companyId}/${id}` : `/quotations/${id}`,
          method: "GET",
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: "Quotation", id: typeof arg === "string" ? arg : arg.id },
      ],
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
      { companyId?: string; id: string; data: UpdateQuotationRequest }
    >({
      query: ({ companyId, id, data }) => ({
        url: companyId ? `/quotations/${companyId}/${id}` : `/quotations/${id}`,
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
      { companyId?: string; id: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        const companyId = typeof arg === "object" ? arg.companyId : undefined;
        return {
          url: companyId ? `/quotations/${companyId}/${id}/send` : `/quotations/${id}/send`,
          method: "POST",
        };
      },
      invalidatesTags: (_result, _error, arg) => [
        "Quotation",
        { type: "Quotation", id: typeof arg === "string" ? arg : arg.id },
        "Deal",
      ],
    }),

    addQuotationItem: builder.mutation<
      ApiResponse<{ item: QuotationItemDetail }>,
      { companyId?: string; quotationId: string; productId: string; quantity: number }
    >({
      query: ({ companyId, quotationId, productId, quantity }) => ({
        url: companyId
          ? `/quotations/${companyId}/${quotationId}/items`
          : `/quotations/${quotationId}/items`,
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
      { companyId?: string; quotationId: string; itemId: string }
    >({
      query: ({ companyId, quotationId, itemId }) => ({
        url: companyId
          ? `/quotations/${companyId}/${quotationId}/items/${itemId}`
          : `/quotations/${quotationId}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { quotationId }) => [
        "Quotation",
        { type: "Quotation", id: quotationId },
      ],
    }),

    cancelQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { companyId?: string; id: string; reason?: string }
    >({
      query: ({ companyId, id, reason }) => ({
        url: companyId ? `/quotations/${companyId}/${id}/cancel` : `/quotations/${id}/cancel`,
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
      { companyId?: string; id: string; reason?: string }
    >({
      query: ({ companyId, id, reason }) => ({
        url: companyId ? `/quotations/${companyId}/${id}/reject` : `/quotations/${id}/reject`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    submitCounterOffer: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      {
        companyId?: string;
        id: string;
        data: {
          message?: string;
          proposedPrice?: number;
          proposedDiscount?: number;
          discountType?: "PERCENTAGE" | "FIXED";
          items?: {
            quotationItemId?: string;
            productId?: string;
            requestedQuantity?: number;
            requestedUnitPrice?: number;
            requestedDiscountType?: "PERCENTAGE" | "FIXED";
            requestedDiscountValue?: number;
          }[];
        };
      }
    >({
      query: ({ companyId, id, data }) => ({
        url: companyId
          ? `/quotations/${companyId}/${id}/counter-offer`
          : `/quotations/${id}/counter-offer`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    updateQuotationStatus: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { companyId?: string; id: string; status: string }
    >({
      query: ({ companyId, id, status }) => ({
        url: companyId
          ? `/quotations/${companyId}/${id}/status`
          : `/quotations/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Quotation",
        { type: "Quotation", id },
        "Deal",
      ],
    }),

    getNegotiations: builder.query<
      ApiResponse<{ negotiations: NegotiationDetail[] }>,
      { companyId?: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: companyId
          ? `/quotations/${companyId}/${id}/negotiations`
          : `/quotations/${id}/negotiations`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
      ],
    }),

    getRevisions: builder.query<
      ApiResponse<{ revisions: QuotationRevisionDetail[] }>,
      { companyId?: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: companyId
          ? `/quotations/${companyId}/${id}/revisions`
          : `/quotations/${id}/revisions`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Quotation", id },
      ],
    }),

    createRevision: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { companyId?: string; quotationId: string; data: Record<string, unknown> }
    >({
      query: ({ companyId, quotationId, data }) => ({
        url: companyId
          ? `/quotations/${companyId}/${quotationId}`
          : `/quotations/${quotationId}`,
        method: "PATCH",
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
  useGetNegotiationsQuery,
  useGetRevisionsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useSendQuotationMutation,
  useAddQuotationItemMutation,
  useRemoveQuotationItemMutation,
  useCancelQuotationMutation,
  useRejectQuotationMutation,
  useSubmitCounterOfferMutation,
  useUpdateQuotationStatusMutation,
  useCreateRevisionMutation,
} = quotationApi;


