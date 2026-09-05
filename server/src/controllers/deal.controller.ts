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
  customerDealFilterSchema,
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

  public listCustomerDeals = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const filterResult = customerDealFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const companyIdParam =
      typeof req.params.companyId === "string"
        ? req.params.companyId
        : undefined;
    const companyId = companyIdParam || filterResult.data.companyId;

    const result = await this.dealService.listCustomerDeals(userId, {
      ...filterResult.data,
      ...(companyId ? { companyId } : {}),
    });

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Customer deals fetched successfully",
        ),
      );
  });

  public listCustomerDealQuotations = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      }

      const dealId = (req.params.dealId || req.params.id) as string;
      if (!dealId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Deal ID is required");
      }

      const companyId = req.params.companyId as string | undefined;

      // Verify the deal belongs to the requesting customer
      const deal = await this.dealService.getDealById(dealId);
      if (companyId && deal.companyId !== companyId) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Deal does not belong to the specified company",
        );
      }
      if (deal.customerId !== userId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view quotations for this deal",
        );
      }

      const filterResult = dealQuotationsQuerySchema.safeParse(req.query);
      if (!filterResult.success) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Invalid query parameters",
          filterResult.error.errors,
        );
      }

      // Customers can view all non-DRAFT quotations (SENT, NEGOTIATING, ACCEPTED, REJECTED, EXPIRED, CANCELLED)
      const queryFilters = {
        ...filterResult.data,
      };

      const result = await this.quotationService.listQuotationsByDeal(
        dealId,
        queryFilters,
        companyId,
        true, // excludeDraft: customer cannot view internal DRAFTs
      );

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            result,
            "Customer deal quotations fetched successfully",
          ),
        );
    },
  );

  public getCustomerDealById = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      }

      const id = (req.params.dealId || req.params.id) as string;
      if (!id) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Deal ID is required");
      }

      const companyId = req.params.companyId as string | undefined;
      const deal = await this.dealService.getDealById(id);

      if (companyId && deal.companyId !== companyId) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Deal does not belong to the specified company",
        );
      }

      if (deal.customerId !== userId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to view this deal",
        );
      }

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            { deal },
            "Customer deal fetched successfully",
          ),
        );
    },
  );
}

export const dealController = new DealController();
