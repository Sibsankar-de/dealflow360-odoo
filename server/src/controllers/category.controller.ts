import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  CategoryService,
  categoryService as defaultCategoryService,
} from "../services/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryListQuerySchema,
} from "../schemas/category.schema";

export class CategoryController {
  private categoryService: CategoryService;

  public constructor(
    categoryService: CategoryService = defaultCategoryService,
  ) {
    this.categoryService = categoryService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(createCategorySchema, req.body);
    const category = await this.categoryService.createCategory(
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { category },
          "Category created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const categoryId = (req.params.categoryId || req.params.id) as string;
    if (!categoryId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category ID is required");
    }

    const category = await this.categoryService.getCategory(
      categoryId,
      req.company.id,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { category },
          "Category fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const parsed = categoryListQuerySchema.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    const result = await this.categoryService.listCategories(
      req.company.id,
      filters,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Categories fetched successfully",
        ),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const categoryId = (req.params.categoryId || req.params.id) as string;
    if (!categoryId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category ID is required");
    }

    const validated = validateBody(updateCategorySchema, req.body);
    const category = await this.categoryService.updateCategory(
      categoryId,
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { category },
          "Category updated successfully",
        ),
      );
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const categoryId = (req.params.categoryId || req.params.id) as string;
    if (!categoryId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category ID is required");
    }

    await this.categoryService.deleteCategory(categoryId, req.company.id);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Category deleted successfully"),
      );
  });
}

export const categoryController = new CategoryController();
