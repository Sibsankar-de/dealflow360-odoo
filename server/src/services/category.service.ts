import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  CategoryRepository,
  categoryRepository as defaultCategoryRepository,
} from "../repositories/category.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prismaTransaction, TransactionClient } from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryListQueryDto,
  CategoryResponseDto,
  toCategoryDto,
} from "../dto/category.dto";

export class CategoryService {
  private categoryRepo: CategoryRepository;

  public constructor(
    categoryRepo: CategoryRepository = defaultCategoryRepository,
  ) {
    this.categoryRepo = categoryRepo;
  }

  public async createCategory(
    companyId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const existing = await this.categoryRepo.findByName(companyId, dto.name, tx);
      if (existing) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          `Category "${dto.name}" already exists in this company`,
        );
      }

      const category = await this.categoryRepo.create(
        {
          companyId,
          name: dto.name,
          description: dto.description ?? null,
        },
        tx,
      );

      return toCategoryDto(category);
    });
  }

  public async getCategory(
    categoryId: string,
    companyId: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepo.findById(categoryId, companyId);
    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
    }

    return toCategoryDto(category);
  }

  public async listCategories(
    companyId: string,
    filters: CategoryListQueryDto,
  ): Promise<PaginatedResult<CategoryResponseDto>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: Prisma.CategoryWhereInput = {
      companyId,
    };

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: Prisma.QueryMode.insensitive,
      };
    }

    const result = await this.categoryRepo.findMany(where, { page, limit });

    return {
      ...result,
      docs: result.docs.map(toCategoryDto),
    };
  }

  public async updateCategory(
    categoryId: string,
    companyId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const existing = await this.categoryRepo.findById(categoryId, companyId, tx);
      if (!existing) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
      }

      if (dto.name && dto.name.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await this.categoryRepo.findByName(companyId, dto.name, tx);
        if (duplicate && duplicate.id !== categoryId) {
          throw new ApiError(
            StatusCodes.CONFLICT,
            `Category "${dto.name}" already exists in this company`,
          );
        }
      }

      const updateData: Prisma.CategoryUpdateInput = {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      };

      const updated = await this.categoryRepo.update(categoryId, updateData, tx);
      return toCategoryDto(updated);
    });
  }

  public async deleteCategory(
    categoryId: string,
    companyId: string,
  ): Promise<void> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const existing = await this.categoryRepo.findById(categoryId, companyId, tx);
      if (!existing) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
      }

      await this.categoryRepo.delete(categoryId, tx);
    });
  }
}

export const categoryService = new CategoryService();
