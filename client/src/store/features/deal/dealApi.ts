import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  DealResponseType,
  CreateDealRequest,
  UpdateDealRequest,
  ListDealsQuery,
  ListDealQuotationsQuery,
  DealListData,
} from "@/types/deal";
import {
  QuotationResponse,
  CreateQuotationRequest,
} from "@/types/quotation";

export const dealApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query<
      ApiResponse<DealListData>,
      { companyId: string; params?: ListDealsQuery }
    >({
      query: ({ companyId, params }) => ({
        url: `/deals/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: ["Deal"],
    }),

    getDealById: builder.query<
      ApiResponse<{ deal: DealResponseType }>,
      { companyId: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: `/deals/${companyId}/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Deal", id }],
    }),

    getDealQuotations: builder.query<
      ApiResponse<{ docs: QuotationResponse[]; total: number; page: number; limit: number; totalPages: number }>,
      { companyId: string; dealId: string; params?: ListDealQuotationsQuery }
    >({
      query: ({ companyId, dealId, params }) => ({
        url: `/deals/${companyId}/${dealId}/quotations`,
        method: "GET",
        params,
      }),
      providesTags: (_result, _error, { dealId }) => [
        "Quotation",
        { type: "Deal", id: dealId },
      ],
    }),

    createDeal: builder.mutation<
      ApiResponse<{ deal: DealResponseType }>,
      { companyId: string; data: CreateDealRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/deals/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Deal"],
    }),

    updateDeal: builder.mutation<
      ApiResponse<{ deal: DealResponseType }>,
      { companyId: string; id: string; data: UpdateDealRequest }
    >({
      query: ({ companyId, id, data }) => ({
        url: `/deals/${companyId}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Deal",
        { type: "Deal", id },
      ],
    }),

    deleteDeal: builder.mutation<
      ApiResponse<{ message: string }>,
      { companyId: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: `/deals/${companyId}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Deal"],
    }),

    createDealQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      { companyId: string; dealId: string; data: CreateQuotationRequest }
    >({
      query: ({ companyId, dealId, data }) => ({
        url: `/quotations/${companyId}`,
        method: "POST",
        body: {
          ...data,
          dealId,
        },
      }),
      invalidatesTags: (_result, _error, { dealId }) => [
        "Quotation",
        "Deal",
        { type: "Deal", id: dealId },
      ],
    }),

    reviseQuotation: builder.mutation<
      ApiResponse<{ quotation: QuotationResponse }>,
      {
        companyId: string;
        dealId: string;
        quotationId: string;
        data: Record<string, unknown>;
      }
    >({
      query: ({ companyId, quotationId, data }) => ({
        url: `/quotations/${companyId}/${quotationId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { dealId, quotationId }) => [
        "Quotation",
        "Deal",
        { type: "Deal", id: dealId },
        { type: "Quotation", id: quotationId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDealsQuery,
  useGetDealByIdQuery,
  useGetDealQuotationsQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
  useCreateDealQuotationMutation,
  useReviseQuotationMutation,
} = dealApi;
