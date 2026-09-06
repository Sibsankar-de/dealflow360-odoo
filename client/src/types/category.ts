export interface CategoryResponseType {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCategoriesResponse {
  docs: CategoryResponseType[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export type CategoryListData = PaginatedCategoriesResponse;

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string | null;
}

export interface ListCategoriesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AddOrRemoveProductCategoriesRequest {
  categoryIdList?: string[];
  categoryIds?: string[];
}
