import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import {
  DeliveryService,
  deliveryService as defaultDeliveryService,
} from "../services/delivery.service";
import { deliveryFilterSchema } from "../schemas/delivery.schema";

export class DeliveryController {
  private deliveryService: DeliveryService;

  public constructor(
    deliveryService: DeliveryService = defaultDeliveryService,
  ) {
    this.deliveryService = deliveryService;
  }

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const deliveryId = req.params.id || req.params.deliveryId;
    if (!deliveryId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Delivery ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const delivery = await this.deliveryService.getDeliveryById(
      deliveryId,
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { delivery },
          "Delivery fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = deliveryFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.deliveryService.listDeliveries(
      companyId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Deliveries fetched successfully",
        ),
      );
  });
}

export const deliveryController = new DeliveryController();
