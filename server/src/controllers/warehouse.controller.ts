import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  WarehouseService,
  warehouseService as defaultWarehouseService,
} from "../services/warehouse.service";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseListQuerySchema,
} from "../schemas/warehouse.schema";

export class WarehouseController {
  private warehouseService: WarehouseService;

  public constructor(
    warehouseService: WarehouseService = defaultWarehouseService,
  ) {
    this.warehouseService = warehouseService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(createWarehouseSchema, req.body);
    const warehouse = await this.warehouseService.createWarehouse(
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { warehouse },
          "Warehouse created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { warehouseId } = req.params;
    if (!warehouseId || typeof warehouseId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Warehouse ID is required");
    }

    const warehouse = await this.warehouseService.getWarehouse(
      warehouseId,
      req.company.id,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { warehouse },
          "Warehouse fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const parsed = warehouseListQuerySchema.safeParse(req.query);
    const page = parsed.success ? (parsed.data.page ?? 1) : 1;
    const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

    const result = await this.warehouseService.listWarehouses(
      req.company.id,
      page,
      limit,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Warehouses fetched successfully",
        ),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { warehouseId } = req.params;
    if (!warehouseId || typeof warehouseId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Warehouse ID is required");
    }

    const validated = validateBody(updateWarehouseSchema, req.body);
    const warehouse = await this.warehouseService.updateWarehouse(
      warehouseId,
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { warehouse },
          "Warehouse updated successfully",
        ),
      );
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { warehouseId } = req.params;
    if (!warehouseId || typeof warehouseId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Warehouse ID is required");
    }

    await this.warehouseService.deleteWarehouse(warehouseId, req.company.id);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Warehouse deleted successfully"),
      );
  });
}

export const warehouseController = new WarehouseController();
