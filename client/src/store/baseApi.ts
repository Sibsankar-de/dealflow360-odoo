import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isAuthPath =
      typeof args === "string"
        ? args.includes("/auth/login") || args.includes("/auth/register") || args.includes("/auth/refresh")
        : args.url.includes("/auth/login") || args.url.includes("/auth/register") || args.url.includes("/auth/refresh");

    if (!isAuthPath) {
      const refreshResult = await rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Company",
    "Quotation",
    "Product",
    "Warehouse",
    "Deal",
    "Customer",
    "Invoice",
    "Backorder",
    "Subscription",
    "SubscriptionPricing",
  ],
  endpoints: () => ({}),
});

