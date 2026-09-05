import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  ProductService,
  productService as defaultProductService,
} from "../services/product.service";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  upsertStockSchema,
  addOrRemoveCategorySchema,
} from "../schemas/product.schema";
import { searchProductsInElasticsearch } from "../services/elasticsearch.service";

export class ProductController {
  private productService: ProductService;

  public constructor(productService: ProductService = defaultProductService) {
    this.productService = productService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(createProductSchema, req.body);
    const product = await this.productService.createProduct(
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { product },
          "Product created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { productId } = req.params;
    if (!productId || typeof productId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
    }

    const product = await this.productService.getProduct(
      productId,
      req.company.id,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { product },
          "Product fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const parsed = productListQuerySchema.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    const result = await this.productService.listProducts(req.company.id, {
      type: filters.type,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    });

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Products fetched successfully",
        ),
      );
  });

  public search = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const query =
      (req.query.query as string) || (req.query.search as string) || "";
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const products = await searchProductsInElasticsearch(
      req.company.id,
      query,
      isNaN(limit) || limit <= 0 ? 10 : limit,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          products,
          "Products searched successfully",
        ),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { productId } = req.params;
    if (!productId || typeof productId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
    }

    const validated = validateBody(updateProductSchema, req.body);
    const product = await this.productService.updateProduct(
      productId,
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { product },
          "Product updated successfully",
        ),
      );
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { productId } = req.params;
    if (!productId || typeof productId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
    }

    await this.productService.deleteProduct(productId, req.company.id);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Product deleted successfully"),
      );
  });

  public upsertStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { productId, warehouseId } = req.params;
    if (!productId || typeof productId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
    }
    if (!warehouseId || typeof warehouseId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Warehouse ID is required");
    }

    const validated = validateBody(upsertStockSchema, req.body);

    await this.productService.upsertProductStock(
      productId,
      req.company.id,
      warehouseId,
      validated.stockQty,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          null,
          "Stock updated successfully",
        ),
      );
  });

  public deleteStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { productId, warehouseId } = req.params;
    if (!productId || typeof productId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
    }
    if (!warehouseId || typeof warehouseId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Warehouse ID is required");
    }

    await this.productService.deleteProductStock(
      productId,
      req.company.id,
      warehouseId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Stock entry deleted successfully"),
      );
  });

  public addOrRemoveCategories = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { productId } = req.params;
    if (!productId || typeof productId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
    }

    const validated = validateBody(addOrRemoveCategorySchema, req.body);
    const categoryIdList = validated.categoryIdList ?? validated.categoryIds ?? [];

    const product = await this.productService.addOrRemoveCategories(
      productId,
      req.company.id,
      categoryIdList,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { product },
          "Product categories updated successfully",
        ),
      );
  });
}

export const productController = new ProductController();
