import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  BackorderResponse,
  BackorderSummaryResponse,
  ListBackordersQuery,
  FulfillBackorderPayload,
} from "@/types/backorder";

export const backorderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBackorders: builder.query<
      ApiResponse<{
        docs: BackorderResponse[];
        totalDocs?: number;
        total?: number;
        page: number;
        limit?: number;
        totalPages: number;
      }>,
      { companyId?: string; params?: ListBackordersQuery } | void
    >({
      query: (arg) => {
        const companyId = arg && typeof arg === "object" ? arg.companyId : undefined;
        const params = arg && typeof arg === "object" ? arg.params : undefined;
        return {
          url: companyId ? `/backorders/${companyId}` : "/backorders",
          method: "GET",
          params,
        };
      },
      providesTags: ["Backorder"],
    }),

    getBackorderById: builder.query<
      ApiResponse<{ backorder: BackorderResponse }>,
      { companyId?: string; id: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        const companyId = typeof arg === "object" ? arg.companyId : undefined;
        return {
          url: companyId ? `/backorders/${companyId}/${id}` : `/backorders/${id}`,
          method: "GET",
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: "Backorder", id: typeof arg === "string" ? arg : arg.id },
      ],
    }),

    getBackorderSummary: builder.query<
      ApiResponse<BackorderSummaryResponse>,
      { companyId: string }
    >({
      query: ({ companyId }) => ({
        url: `/backorders/${companyId}/summary`,
        method: "GET",
      }),
      providesTags: ["Backorder"],
    }),

    fulfillBackorder: builder.mutation<
      ApiResponse<unknown>,
      { companyId: string; backorderId: string; data: FulfillBackorderPayload }
    >({
      query: ({ companyId, backorderId, data }) => ({
        url: `/backorders/${companyId}/${backorderId}/fulfill`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { backorderId }) => [
        "Backorder",
        { type: "Backorder", id: backorderId },
        "Quotation",
        "Invoice",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBackordersQuery,
  useGetBackorderByIdQuery,
  useGetBackorderSummaryQuery,
  useFulfillBackorderMutation,
} = backorderApi;
