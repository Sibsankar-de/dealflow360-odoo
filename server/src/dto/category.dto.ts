import { z } from "zod";
import { Category } from "@prisma/client";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryListQuerySchema,
} from "../schemas/category.schema";

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryListQueryDto = z.infer<typeof categoryListQuerySchema>;

export interface CategoryResponseDto {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
}

export const toCategoryDto = (
  category: Category & {
    _count?: {
      products?: number;
    };
  },
): CategoryResponseDto => {
  return {
    id: category.id,
    companyId: category.companyId,
    name: category.name,
    description: category.description ?? null,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    productCount: category._count?.products,
  };
};
