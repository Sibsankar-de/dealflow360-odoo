import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  QuotationService,
  quotationService as defaultQuotationService,
} from "../services/quotation.service";
import {
  createQuotationSchema,
  updateQuotationSchema,
  quotationFilterSchema,
} from "../schemas/quotation.schema";
import { QuotationStatus } from "@prisma/client";

export class QuotationController {
  private quotationService: QuotationService;

  public constructor(
    quotationService: QuotationService = defaultQuotationService,
  ) {
    this.quotationService = quotationService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const validated = validateBody(createQuotationSchema, req.body);
    const quotation = await this.quotationService.createQuotation(
      userId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { quotation },
          "Quotation created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const quotation = await this.quotationService.getQuotationById(id, userId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation },
          "Quotation fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const filterResult = quotationFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.quotationService.listQuotations(
      userId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Quotations fetched successfully",
        ),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const validated = validateBody(updateQuotationSchema, req.body);
    const updated = await this.quotationService.updateQuotation(
      id,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation: updated },
          "Quotation updated successfully",
        ),
      );
  });

  public updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const { status } = req.body;
    if (!status || !Object.values(QuotationStatus).includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Valid status is required");
    }

    const updated = await this.quotationService.updateQuotationStatus(
      id,
      userId,
      status,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation: updated },
          "Quotation status updated successfully",
        ),
      );
  });
}

export const quotationController = new QuotationController();
