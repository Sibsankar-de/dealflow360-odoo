import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import { CompanyResponseType, CreateCompanyRequest } from "@/types/company";

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserCompanies: builder.query<ApiResponse<{ companies: CompanyResponseType[] }>, void>({
      query: () => ({
        url: "/companies/my",
        method: "GET",
      }),
      providesTags: ["Company"],
    }),

    createCompany: builder.mutation<
      ApiResponse<{ company: CompanyResponseType }>,
      CreateCompanyRequest
    >({
      query: (data) => ({
        url: "/companies",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Company"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetUserCompaniesQuery, useCreateCompanyMutation } = companyApi;
