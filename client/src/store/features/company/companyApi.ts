import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  CompanyResponseType,
  CompanyMemberType,
  CreateCompanyRequest,
  UserCompaniesData,
  AddCompanyUserRequest,
  UpdateCompanyUserRoleRequest,
  CompanyRoleDefinition,
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
  useGetCompanyMembersQuery,
  useGetCompanyRolesQuery,
  useCreateCompanyMutation,
  useAddCompanyMemberMutation,
  useUpdateCompanyMemberRoleMutation,
  useRemoveCompanyMemberMutation,
} = companyApi;


