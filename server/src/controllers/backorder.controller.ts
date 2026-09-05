import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  BackorderService,
  backorderService as defaultBackorderService,
} from "../services/backorder.service";
import {
  backorderFilterSchema,
  fulfillBackorderSchema,
} from "../schemas/backorder.schema";

export class BackorderController {
  private backorderService: BackorderService;

  public constructor(
    backorderService: BackorderService = defaultBackorderService,
  ) {
    this.backorderService = backorderService;
  }

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const backorderId = req.params.id || req.params.backorderId;
    if (!backorderId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Backorder ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const backorder = await this.backorderService.getBackorderById(
      backorderId,
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { backorder },
          "Backorder fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = backorderFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.backorderService.listBackorders(
      companyId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Backorders fetched successfully",
        ),
      );
  });

  public fulfill = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const backorderId = req.params.id || req.params.backorderId;
    if (!backorderId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Backorder ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = validateBody(fulfillBackorderSchema, req.body);
    const delivery = await this.backorderService.fulfillBackorder(
      companyId,
      userId,
      backorderId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { delivery },
          "Backorder fulfilled successfully",
        ),
      );
  });
}

export const backorderController = new BackorderController();
