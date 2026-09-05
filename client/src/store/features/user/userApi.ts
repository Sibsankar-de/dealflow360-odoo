import { baseApi } from "@/store/baseApi";
import {
  ApiResponse,
  AuthData,
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UpdatePasswordRequest,
  UserResponseType,
} from "@/types/auth";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthData>, LoginUserRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    register: builder.mutation<ApiResponse<AuthData>, RegisterUserRequest>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Company", "Quotation"],
    }),

    getProfile: builder.query<ApiResponse<{ user: UserResponseType }>, void>({
      query: () => ({
        url: "/auth/profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation<
      ApiResponse<{ user: UserResponseType }>,
      UpdateUserRequest
    >({
      query: (data) => ({
        url: "/auth/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    updatePassword: builder.mutation<ApiResponse<null>, UpdatePasswordRequest>({
      query: (data) => ({
        url: "/auth/update-password",
        method: "POST",
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
} = userApi;
