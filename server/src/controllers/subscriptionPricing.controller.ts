import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  SubscriptionPricingService,
  subscriptionPricingService as defaultSubscriptionPricingService,
} from "../services/subscriptionPricing.service";
import {
  createSubscriptionPricingSchema,
  updateSubscriptionPricingSchema,
  subscriptionPricingFilterSchema,
} from "../schemas/subscriptionPricing.schema";

export class SubscriptionPricingController {
  private pricingService: SubscriptionPricingService;

  public constructor(
    pricingService: SubscriptionPricingService = defaultSubscriptionPricingService,
  ) {
    this.pricingService = pricingService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = validateBody(createSubscriptionPricingSchema, req.body);
    const pricing = await this.pricingService.createPricing(
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { pricing },
          "Subscription pricing configured successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const pricingId = String(req.params.id || req.params.pricingId || "");
    if (!pricingId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Subscription pricing ID is required",
      );
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const pricing = await this.pricingService.getPricingById(
      pricingId,
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { pricing },
          "Subscription pricing fetched successfully",
        ),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const pricingId = String(req.params.id || req.params.pricingId || "");
    if (!pricingId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Subscription pricing ID is required",
      );
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = validateBody(updateSubscriptionPricingSchema, req.body);
    const pricing = await this.pricingService.updatePricing(
      pricingId,
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { pricing },
          "Subscription pricing updated successfully",
        ),
      );
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    const pricingId = String(req.params.id || req.params.pricingId || "");
    if (!pricingId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Subscription pricing ID is required",
      );
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    await this.pricingService.deletePricing(pricingId, companyId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          null,
          "Subscription pricing deleted successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = subscriptionPricingFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.pricingService.listPricing(
      companyId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Subscription pricings fetched successfully",
        ),
      );
  });
}

export const subscriptionPricingController =
  new SubscriptionPricingController();
