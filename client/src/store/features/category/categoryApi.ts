import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  CategoryResponseType,
  CategoryListData,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ListCategoriesQuery,
} from "@/types/category";

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<
      ApiResponse<CategoryListData>,
      { companyId: string; params?: ListCategoriesQuery }
    >({
      query: ({ companyId, params }) => ({
        url: `/categories/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: ["Category"],
    }),

    getCategoryById: builder.query<
      ApiResponse<{ category: CategoryResponseType }>,
      { companyId: string; categoryId: string }
    >({
      query: ({ companyId, categoryId }) => ({
        url: `/categories/${companyId}/${categoryId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { categoryId }) => [
        { type: "Category", id: categoryId },
      ],
    }),

    createCategory: builder.mutation<
      ApiResponse<{ category: CategoryResponseType }>,
      { companyId: string; data: CreateCategoryRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/categories/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Category", "Product"],
    }),

    updateCategory: builder.mutation<
      ApiResponse<{ category: CategoryResponseType }>,
      { companyId: string; categoryId: string; data: UpdateCategoryRequest }
    >({
      query: ({ companyId, categoryId, data }) => ({
        url: `/categories/${companyId}/${categoryId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        "Category",
        "Product",
        { type: "Category", id: categoryId },
      ],
    }),

    deleteCategory: builder.mutation<
      ApiResponse<null>,
      { companyId: string; categoryId: string }
    >({
      query: ({ companyId, categoryId }) => ({
        url: `/categories/${companyId}/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category", "Product"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
