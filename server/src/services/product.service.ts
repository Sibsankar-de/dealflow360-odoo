import { Prisma, ProductType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  ProductRepository,
  productRepository as defaultProductRepository,
} from "../repositories/product.repository";
import {
  WarehouseRepository,
  warehouseRepository as defaultWarehouseRepository,
} from "../repositories/warehouse.repository";
import {
  CategoryRepository,
  categoryRepository as defaultCategoryRepository,
} from "../repositories/category.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prismaTransaction } from "../utils/transactionHandler";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListDto,
  ProductResponseDto,
  toProductDto,
} from "../dto/product.dto";
import {
  publishElasticsearchJob,
  buildProductIndexDocument,
} from "./elasticsearchPublisher.service";

export class ProductService {
  private productRepo: ProductRepository;
  private warehouseRepo: WarehouseRepository;
  private categoryRepo: CategoryRepository;

  public constructor(
    productRepo: ProductRepository = defaultProductRepository,
    warehouseRepo: WarehouseRepository = defaultWarehouseRepository,
    categoryRepo: CategoryRepository = defaultCategoryRepository,
  ) {
    this.productRepo = productRepo;
    this.warehouseRepo = warehouseRepo;
    this.categoryRepo = categoryRepo;
  }

  public async createProduct(
    companyId: string,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return prismaTransaction(async (tx) => {
      const stocks: Array<{ warehouseId: string; stockQty: Prisma.Decimal }> =
        [];

      if (dto.stocks && dto.stocks.length > 0) {
        for (const entry of dto.stocks) {
          const warehouse = await this.warehouseRepo.findById(
            entry.warehouseId,
            companyId,
            tx,
          );
          if (!warehouse) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              `Warehouse ${entry.warehouseId} not found in this company`,
            );
          }
          stocks.push({
            warehouseId: entry.warehouseId,
            stockQty: new Prisma.Decimal(entry.stockQty),
          });
        }
      }

      const categoryIdList = dto.categoryIdList ?? dto.categoryIds ?? [];
      if (categoryIdList.length > 0) {
        const categories = await this.categoryRepo.findByIds(
          categoryIdList,
          companyId,
          tx,
        );
        if (categories.length !== categoryIdList.length) {
          const foundIds = new Set(categories.map((c) => c.id));
          const missingIds = categoryIdList.filter((id) => !foundIds.has(id));
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Categories not found in this company: ${missingIds.join(", ")}`,
          );
        }
      }

      const product = await this.productRepo.create(
        {
          companyId,
          name: dto.name,
          description: dto.description ?? null,
          price: new Prisma.Decimal(dto.price),
          baseUnit: dto.baseUnit ?? "UNIT",
          type: dto.type ?? ProductType.ONE_TIME,
        },
        stocks,
        categoryIdList,
        tx,
      );

      void publishElasticsearchJob({
        action: "index",
        entity: "product",
        id: product.id,
        companyId: product.companyId,
        data: buildProductIndexDocument(product),
      });

      return toProductDto(product);
    });
  }

  public async getProduct(
    productId: string,
    companyId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById(productId, companyId);
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }
    return toProductDto(product);
  }

  public async listProducts(
    companyId: string,
    filters: {
      type?: ProductType;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<ProductListDto> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const { products, total } = await this.productRepo.findMany(
      companyId,
      { type: filters.type, search: filters.search },
      page,
      limit,
    );

    return {
      products: products.map(toProductDto),
      total,
      page,
      limit,
    };
  }

  public async updateProduct(
    productId: string,
    companyId: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return prismaTransaction(async (tx) => {
      const existing = await this.productRepo.findById(
        productId,
        companyId,
        tx,
      );
      if (!existing) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
      }

      const categoryIdList = dto.categoryIdList ?? dto.categoryIds;
      if (categoryIdList !== undefined) {
        if (categoryIdList.length > 0) {
          const categories = await this.categoryRepo.findByIds(
            categoryIdList,
            companyId,
            tx,
          );
          if (categories.length !== categoryIdList.length) {
            const foundIds = new Set(categories.map((c) => c.id));
            const missingIds = categoryIdList.filter((id) => !foundIds.has(id));
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              `Categories not found in this company: ${missingIds.join(", ")}`,
            );
          }
        }
        await this.productRepo.addOrRemoveCategories(
          productId,
          categoryIdList,
          tx,
        );
      }

      await this.productRepo.update(
        productId,
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.price !== undefined
            ? { price: new Prisma.Decimal(dto.price) }
            : {}),
          ...(dto.baseUnit !== undefined ? { baseUnit: dto.baseUnit } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
        },
        tx,
      );

      const refreshed = await this.productRepo.findById(
        productId,
        companyId,
        tx,
      );

      if (refreshed) {
        void publishElasticsearchJob({
          action: "index",
          entity: "product",
          id: refreshed.id,
          companyId: refreshed.companyId,
          data: buildProductIndexDocument(refreshed),
        });
      }

      return toProductDto(refreshed!);
    });
  }

  public async deleteProduct(
    productId: string,
    companyId: string,
  ): Promise<void> {
    return prismaTransaction(async (tx) => {
      const existing = await this.productRepo.findById(
        productId,
        companyId,
        tx,
      );
      if (!existing) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
      }
      await this.productRepo.delete(productId, tx);

      void publishElasticsearchJob({
        action: "delete",
        entity: "product",
        id: productId,
        companyId,
      });
    });
  }

  public async upsertProductStock(
    productId: string,
    companyId: string,
    warehouseId: string,
    stockQty: number,
  ): Promise<void> {
    return prismaTransaction(async (tx) => {
      const product = await this.productRepo.findById(productId, companyId, tx);
      if (!product) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
      }

      const warehouse = await this.warehouseRepo.findById(
        warehouseId,
        companyId,
        tx,
      );
      if (!warehouse) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Warehouse not found");
      }

      await this.productRepo.upsertStock(
        productId,
        warehouseId,
        new Prisma.Decimal(stockQty),
        tx,
      );
    });
  }

  public async deleteProductStock(
    productId: string,
    companyId: string,
    warehouseId: string,
  ): Promise<void> {
    return prismaTransaction(async (tx) => {
      const product = await this.productRepo.findById(productId, companyId, tx);
      if (!product) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
      }

      const warehouse = await this.warehouseRepo.findById(
        warehouseId,
        companyId,
        tx,
      );
      if (!warehouse) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Warehouse not found");
      }

      await this.productRepo.deleteStock(productId, warehouseId, tx);
    });
  }

  public async addOrRemoveCategories(
    productId: string,
    companyId: string,
    categoryIdList: string[],
  ): Promise<ProductResponseDto> {
    return prismaTransaction(async (tx) => {
      const product = await this.productRepo.findById(productId, companyId, tx);
      if (!product) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
      }

      if (categoryIdList.length > 0) {
        const categories = await this.categoryRepo.findByIds(
          categoryIdList,
          companyId,
          tx,
        );
        if (categories.length !== categoryIdList.length) {
          const foundIds = new Set(categories.map((c) => c.id));
          const missingIds = categoryIdList.filter((id) => !foundIds.has(id));
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Categories not found in this company: ${missingIds.join(", ")}`,
          );
        }
      }

      await this.productRepo.addOrRemoveCategories(
        productId,
        categoryIdList,
        tx,
      );

      const updated = await this.productRepo.findById(productId, companyId, tx);
      return toProductDto(updated!);
    });
  }
}

export const productService = new ProductService();
