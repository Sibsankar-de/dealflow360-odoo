import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  CustomerResponseType,
  CustomerListData,
  ListCustomersQuery,
  AddCustomerRequest,
} from "@/types/customer";
import { CompanyMemberType } from "@/types/company";

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      ApiResponse<CustomerListData>,
      { companyId: string; params?: ListCustomersQuery }
    >({
      query: ({ companyId, params }) => ({
        url: `/customers/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: ["Customer"],
    }),

    getCustomerById: builder.query<
      ApiResponse<{ customer: CustomerResponseType }>,
      { companyId: string; customerId: string }
    >({
      query: ({ companyId, customerId }) => ({
        url: `/customers/${companyId}/${customerId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: "Customer", id: customerId },
      ],
    }),

    addCustomer: builder.mutation<
      ApiResponse<{ member: CompanyMemberType }>,
      { companyId: string; data: AddCustomerRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/companies/${companyId}/users`,
        method: "POST",
        body: {
          userEmail: data.userEmail,
          role: data.role || "CUSTOMER",
        },
      }),
      invalidatesTags: ["Customer", "Company"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useLazyGetCustomersQuery,
  useGetCustomerByIdQuery,
  useAddCustomerMutation,
} = customerApi;
