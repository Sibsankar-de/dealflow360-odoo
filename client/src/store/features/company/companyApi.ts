import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  CompanyResponseType,
  CompanyMemberType,
  CompanySettingType,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  UpdateCompanySettingRequest,
  PaginatedCompaniesResponse,
  AddCompanyUserRequest,
  UpdateCompanyUserRoleRequest,
  CompanyRoleDefinition,
} from "@/types/company";

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserCompanies: builder.query<
      ApiResponse<PaginatedCompaniesResponse>,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/companies",
        method: "GET",
        params: {
          myCompanies: true,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
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

    getCompanySettings: builder.query<
      ApiResponse<{ settings: CompanySettingType }>,
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}/settings`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Company", id: `settings-${id}` }],
    }),

    getCompanyMembers: builder.query<
      ApiResponse<{ members: CompanyMemberType[] }>,
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}/users`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "Company", id: `members-${id}` },
      ],
    }),

    getCompanyRoles: builder.query<
      ApiResponse<{ roles: CompanyRoleDefinition[] }>,
      string
    >({
      query: (companyId) => ({
        url: `/companies/${companyId}/roles`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "Company", id: `roles-${id}` },
      ],
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

    updateCompany: builder.mutation<
      ApiResponse<{ company: CompanyResponseType }>,
      { companyId: string; data: UpdateCompanyRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/companies/${companyId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        "Company",
        { type: "Company", id: companyId },
      ],
    }),

    updateCompanySettings: builder.mutation<
      ApiResponse<{ settings: CompanySettingType }>,
      { companyId: string; data: UpdateCompanySettingRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/companies/${companyId}/settings`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "Company", id: companyId },
        { type: "Company", id: `settings-${companyId}` },
      ],
    }),

    addCompanyMember: builder.mutation<
      ApiResponse<{ member: CompanyMemberType }>,
      { companyId: string; data: AddCompanyUserRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/companies/${companyId}/users`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "Company", id: `members-${companyId}` },
      ],
    }),

    updateCompanyMemberRole: builder.mutation<
      ApiResponse<{ member: CompanyMemberType }>,
      { companyId: string; data: UpdateCompanyUserRoleRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/companies/${companyId}/users`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "Company", id: `members-${companyId}` },
      ],
    }),

    removeCompanyMember: builder.mutation<
      ApiResponse<null>,
      { companyId: string; userId: string }
    >({
      query: ({ companyId, userId }) => ({
        url: `/companies/${companyId}/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "Company", id: `members-${companyId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetCompanySettingsQuery,
  useGetCompanyMembersQuery,
  useGetCompanyRolesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useUpdateCompanySettingsMutation,
  useAddCompanyMemberMutation,
  useUpdateCompanyMemberRoleMutation,
  useRemoveCompanyMemberMutation,
} = companyApi;



