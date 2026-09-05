import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  ProductResponseType,
  CreateProductRequest,
  UpdateProductRequest,
  UpsertProductStockRequest,
  ListProductsQuery,
  ProductListData,
} from "@/types/product";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      ApiResponse<ProductListData>,
      { companyId: string; params?: ListProductsQuery }
    >({
      query: ({ companyId, params }) => ({
        url: `/products/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: ["Product"],
    }),

    getProductById: builder.query<
      ApiResponse<{ product: ProductResponseType }>,
      { companyId: string; productId: string }
    >({
      query: ({ companyId, productId }) => ({
        url: `/products/${companyId}/${productId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { productId }) => [
        { type: "Product", id: productId },
      ],
    }),

    createProduct: builder.mutation<
      ApiResponse<{ product: ProductResponseType }>,
      { companyId: string; data: CreateProductRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/products/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: builder.mutation<
      ApiResponse<{ product: ProductResponseType }>,
      { companyId: string; productId: string; data: UpdateProductRequest }
    >({
      query: ({ companyId, productId, data }) => ({
        url: `/products/${companyId}/${productId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        "Product",
        { type: "Product", id: productId },
      ],
    }),

    deleteProduct: builder.mutation<
      ApiResponse<{ message: string }>,
      { companyId: string; productId: string }
    >({
      query: ({ companyId, productId }) => ({
        url: `/products/${companyId}/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    upsertProductStock: builder.mutation<
      ApiResponse<null>,
      {
        companyId: string;
        productId: string;
        warehouseId: string;
        data: UpsertProductStockRequest;
      }
    >({
      query: ({ companyId, productId, warehouseId, data }) => ({
        url: `/products/${companyId}/${productId}/stock/${warehouseId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        "Product",
        { type: "Product", id: productId },
      ],
    }),

    deleteProductStock: builder.mutation<
      ApiResponse<null>,
      {
        companyId: string;
        productId: string;
        warehouseId: string;
      }
    >({
      query: ({ companyId, productId, warehouseId }) => ({
        url: `/products/${companyId}/${productId}/stock/${warehouseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        "Product",
        { type: "Product", id: productId },
      ],
    }),
  }),
  overrideExisting: false,
});


export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpsertProductStockMutation,
  useDeleteProductStockMutation,
} = productApi;
