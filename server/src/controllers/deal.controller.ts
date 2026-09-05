import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  DealService,
  dealService as defaultDealService,
} from "../services/deal.service";
import {
  QuotationService,
  quotationService as defaultQuotationService,
} from "../services/quotation.service";
import {
  createDealSchema,
  updateDealSchema,
  dealFilterSchema,
} from "../schemas/deal.schema";
import { dealQuotationsQuerySchema } from "../schemas/quotation.schema";
import { CreateDealDto } from "../dto/deal.dto";

export class DealController {
  private dealService: DealService;
  private quotationService: QuotationService;

  public constructor(
    dealService: DealService = defaultDealService,
    quotationService: QuotationService = defaultQuotationService,
  ) {
    this.dealService = dealService;
    this.quotationService = quotationService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = validateBody(createDealSchema, req.body) as CreateDealDto;
    const deal = await this.dealService.createDeal(companyId, userId, validated);

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(StatusCodes.CREATED, { deal }, "Deal created successfully"),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.dealId || req.params.id) as string;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Deal ID is required");
    }

    const deal = await this.dealService.getDealById(id);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, { deal }, "Deal fetched successfully"),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.dealId || req.params.id) as string;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Deal ID is required");
    }

    const validated = validateBody(updateDealSchema, req.body);
    const deal = await this.dealService.updateDeal(id, validated);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, { deal }, "Deal updated successfully"),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = dealFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.dealService.listDeals(companyId, filterResult.data);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, result, "Deals fetched successfully"),
      );
  });

  public listQuotations = asyncHandler(async (req: Request, res: Response) => {
    const dealId = (req.params.dealId || req.params.id) as string;
    if (!dealId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Deal ID is required");
    }

    const filterResult = dealQuotationsQuerySchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.quotationService.listQuotationsByDeal(
      dealId,
      filterResult.data,
      req.company?.id,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Deal quotations fetched successfully",
        ),
      );
  });
}

export const dealController = new DealController();
