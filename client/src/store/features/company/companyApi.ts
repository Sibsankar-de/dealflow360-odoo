import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  CompanyResponseType,
  CompanyMemberType,
  CreateCompanyRequest,
  UserCompaniesData,
} from "@/types/company";


export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserCompanies: builder.query<
      ApiResponse<UserCompaniesData>,
      void
    >({
      query: () => ({
        url: "/companies",
        method: "GET",
      }),
      providesTags: ["Company"],
    }),

    getCompanyById: builder.query<
      ApiResponse<{ company: CompanyResponseType }>,
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Company", id }],
    }),

    getCompanyMembers: builder.query<
      ApiResponse<{ members: CompanyMemberType[] }>,
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}/users`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Company", id: `members-${id}` }],
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

export const {
  useGetUserCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetCompanyMembersQuery,
  useCreateCompanyMutation,
} = companyApi;

