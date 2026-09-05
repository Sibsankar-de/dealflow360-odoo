import { baseApi } from "@/store/baseApi";
import { ApiResponse } from "@/types/auth";
import {
  WarehouseResponseType,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  ListWarehousesQuery,
  WarehouseListData,
} from "@/types/warehouse";

export const warehouseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouses: builder.query<
      ApiResponse<WarehouseListData>,
      { companyId: string; params?: ListWarehousesQuery }
    >({
      query: ({ companyId, params }) => ({
        url: `/warehouses/${companyId}`,
        method: "GET",
        params,
      }),
      providesTags: ["Warehouse"],
    }),

    getWarehouseById: builder.query<
      ApiResponse<{ warehouse: WarehouseResponseType }>,
      { companyId: string; warehouseId: string }
    >({
      query: ({ companyId, warehouseId }) => ({
        url: `/warehouses/${companyId}/${warehouseId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { warehouseId }) => [
        { type: "Warehouse", id: warehouseId },
      ],
    }),

    createWarehouse: builder.mutation<
      ApiResponse<{ warehouse: WarehouseResponseType }>,
      { companyId: string; data: CreateWarehouseRequest }
    >({
      query: ({ companyId, data }) => ({
        url: `/warehouses/${companyId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Warehouse"],
    }),

    updateWarehouse: builder.mutation<
      ApiResponse<{ warehouse: WarehouseResponseType }>,
      { companyId: string; warehouseId: string; data: UpdateWarehouseRequest }
    >({
      query: ({ companyId, warehouseId, data }) => ({
        url: `/warehouses/${companyId}/${warehouseId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        "Warehouse",
        { type: "Warehouse", id: warehouseId },
      ],
    }),

    deleteWarehouse: builder.mutation<
      ApiResponse<{ message: string }>,
      { companyId: string; warehouseId: string }
    >({
      query: ({ companyId, warehouseId }) => ({
        url: `/warehouses/${companyId}/${warehouseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Warehouse"],
    }),
  }),
  overrideExisting: false,
});


export const {
  useGetWarehousesQuery,
  useLazyGetWarehousesQuery,
  useGetWarehouseByIdQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehouseApi;
