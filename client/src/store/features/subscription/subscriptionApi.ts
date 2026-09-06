import { baseApi } from "@/store/baseApi";
import {
  SubscriptionResponseType,
  SubscriptionSummaryResponseType,
  SubscriptionPeriodResponseType,
  SubscriptionPricingResponseType,
  PaginatedSubscriptionsResponse,
  PaginatedSubscriptionPricingResponse,
  ListSubscriptionsQuery,
  ListCustomerSubscriptionsQuery,
  RenewSubscriptionRequest,
  CancelSubscriptionRequest,
  CreateSubscriptionPricingRequest,
  UpdateSubscriptionPricingRequest,
} from "@/types/subscription";

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Company Subscription Endpoints
    listSubscriptions: builder.query<
      { data: PaginatedSubscriptionsResponse; message: string },
      { companyId: string; params?: ListSubscriptionsQuery }
    >({
      query: ({ companyId, params }) => ({
        url: `/subscriptions/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data?.docs
          ? [
              ...result.data.docs.map(({ id }) => ({
                type: "Subscription" as const,
                id,
              })),
              { type: "Subscription", id: "LIST" },
            ]
          : [{ type: "Subscription", id: "LIST" }],
    }),

    getSubscriptionById: builder.query<
      { data: { subscription: SubscriptionResponseType }; message: string },
      { companyId: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: `/subscriptions/${companyId}/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Subscription", id },
      ],
    }),

    getSubscriptionSummary: builder.query<
      { data: SubscriptionSummaryResponseType; message: string },
      { companyId: string }
    >({
      query: ({ companyId }) => ({
        url: `/subscriptions/${companyId}/summary`,
        method: "GET",
      }),
      providesTags: [{ type: "Subscription", id: "SUMMARY" }],
    }),

    getSubscriptionHistory: builder.query<
      { data: { history: SubscriptionPeriodResponseType[] }; message: string },
      { companyId: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: `/subscriptions/${companyId}/${id}/history`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Subscription", id: `${id}-HISTORY` },
      ],
    }),

    renewSubscription: builder.mutation<
      { data: { subscription: SubscriptionResponseType }; message: string },
      { companyId: string; id: string; data?: RenewSubscriptionRequest }
    >({
      query: ({ companyId, id, data }) => ({
        url: `/subscriptions/${companyId}/${id}/renew`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Subscription", id },
        { type: "Subscription", id: "LIST" },
        { type: "Subscription", id: "SUMMARY" },
        { type: "Subscription", id: `${id}-HISTORY` },
      ],
    }),

    cancelSubscription: builder.mutation<
      { data: { subscription: SubscriptionResponseType }; message: string },
      { companyId: string; id: string; data?: CancelSubscriptionRequest }
    >({
      query: ({ companyId, id, data }) => ({
        url: `/subscriptions/${companyId}/${id}/cancel`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Subscription", id },
        { type: "Subscription", id: "LIST" },
        { type: "Subscription", id: "SUMMARY" },
        { type: "Subscription", id: `${id}-HISTORY` },
      ],
    }),

    // Customer Portal Endpoints
    listCustomerSubscriptions: builder.query<
      { data: PaginatedSubscriptionsResponse; message: string },
      { companyId?: string; params?: ListCustomerSubscriptionsQuery }
    >({
      query: ({ companyId, params }) => ({
        url: companyId
          ? `/subscriptions/customer/${companyId}`
          : `/subscriptions/customer`,
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Subscription", id: "CUSTOMER_LIST" }],
    }),

    getCustomerSubscriptionById: builder.query<
      { data: { subscription: SubscriptionResponseType }; message: string },
      { companyId?: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: companyId
          ? `/subscriptions/customer/${companyId}/${id}`
          : `/subscriptions/customer/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Subscription", id },
      ],
    }),

    customerRenewSubscription: builder.mutation<
      { data: { subscription: SubscriptionResponseType }; message: string },
      { companyId?: string; id: string; data?: RenewSubscriptionRequest }
    >({
      query: ({ companyId, id, data }) => ({
        url: companyId
          ? `/subscriptions/customer/${companyId}/${id}/renew`
          : `/subscriptions/customer/${id}/renew`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Subscription", id },
        { type: "Subscription", id: "LIST" },
        { type: "Subscription", id: "CUSTOMER_LIST" },
        { type: "Subscription", id: "SUMMARY" },
      ],
    }),

    customerCancelSubscription: builder.mutation<
      { data: { subscription: SubscriptionResponseType }; message: string },
      { companyId?: string; id: string; data?: CancelSubscriptionRequest }
    >({
      query: ({ companyId, id, data }) => ({
        url: companyId
          ? `/subscriptions/customer/${companyId}/${id}/cancel`
          : `/subscriptions/customer/${id}/cancel`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Subscription", id },
        { type: "Subscription", id: "LIST" },
        { type: "Subscription", id: "CUSTOMER_LIST" },
        { type: "Subscription", id: "SUMMARY" },
      ],
    }),

    // Subscription Pricing Endpoints
    listSubscriptionPricing: builder.query<
      { data: PaginatedSubscriptionPricingResponse; message: string },
      {
        companyId: string;
        params?: {
          productId?: string;
          subscriptionType?: string;
          customerTier?: string;
          isActive?: boolean;
          page?: number;
          limit?: number;
        };
      }
    >({
      query: ({ companyId, params }) => ({
        url: `/subscription-pricing/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data?.docs
          ? [
              ...result.data.docs.map(({ id }) => ({
                type: "SubscriptionPricing" as const,
                id,
              })),
              { type: "SubscriptionPricing", id: "LIST" },
            ]
          : [{ type: "SubscriptionPricing", id: "LIST" }],
    }),

    getSubscriptionPricingById: builder.query<
      {
        data: { pricing: SubscriptionPricingResponseType };
        message: string;
      },
      { companyId: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: `/subscription-pricing/${companyId}/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "SubscriptionPricing", id },
      ],
    }),

    createSubscriptionPricing: builder.mutation<
      {
        data: { pricing: SubscriptionPricingResponseType };
        message: string;
      },
      { companyId: string; data: CreateSubscriptionPricingRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/subscription-pricing/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        { type: "SubscriptionPricing", id: "LIST" },
        { type: "Product", id: "LIST" },
      ],
    }),

    updateSubscriptionPricing: builder.mutation<
      {
        data: { pricing: SubscriptionPricingResponseType };
        message: string;
      },
      {
        companyId: string;
        id: string;
        data: UpdateSubscriptionPricingRequest;
      }
    >({
      query: ({ companyId, id, data }) => ({
        url: `/subscription-pricing/${companyId}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "SubscriptionPricing", id },
        { type: "SubscriptionPricing", id: "LIST" },
        { type: "Product", id: "LIST" },
      ],
    }),

    deleteSubscriptionPricing: builder.mutation<
      { data: null; message: string },
      { companyId: string; id: string }
    >({
      query: ({ companyId, id }) => ({
        url: `/subscription-pricing/${companyId}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "SubscriptionPricing", id: "LIST" },
        { type: "Product", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListSubscriptionsQuery,
  useGetSubscriptionByIdQuery,
  useGetSubscriptionSummaryQuery,
  useGetSubscriptionHistoryQuery,
  useRenewSubscriptionMutation,
  useCancelSubscriptionMutation,
  useListCustomerSubscriptionsQuery,
  useGetCustomerSubscriptionByIdQuery,
  useCustomerRenewSubscriptionMutation,
  useCustomerCancelSubscriptionMutation,
  useListSubscriptionPricingQuery,
  useGetSubscriptionPricingByIdQuery,
  useCreateSubscriptionPricingMutation,
  useUpdateSubscriptionPricingMutation,
  useDeleteSubscriptionPricingMutation,
} = subscriptionApi;
