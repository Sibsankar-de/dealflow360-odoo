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
  addQuotationItemSchema,
  createQuotationSchema,
  updateQuotationSchema,
  quotationFilterSchema,
  cancelQuotationSchema,
  rejectQuotationSchema,
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
    const quotation = await this.quotationService.createQuotation(userId, {
      ...validated,
      companyId: req.company?.id || validated.companyId,
    });

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
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const quotation = await this.quotationService.getQuotationById(quotationId);

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

  public getItems = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const items = await this.quotationService.getQuotationItems(quotationId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { items },
          "Quotation items fetched successfully",
        ),
      );
  });

  public addItem = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const validated = validateBody(addQuotationItemSchema, req.body);
    const item = await this.quotationService.addQuotationItem(
      quotationId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { item },
          "Quotation item added successfully",
        ),
      );
  });

  public removeItem = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const { itemId } = req.params;
    if (!itemId || typeof itemId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Item ID is required");
    }

    const result = await this.quotationService.removeQuotationItem(
      quotationId,
      itemId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Quotation item removed successfully",
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

    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const validated = validateBody(updateQuotationSchema, req.body);
    const updated = await this.quotationService.updateQuotation(
      quotationId,
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

  public send = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const quotation = await this.quotationService.sendQuotation(quotationId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation },
          "Quotation sent successfully",
        ),
      );
  });

  public getRevisions = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const revisions =
      await this.quotationService.getQuotationRevisions(quotationId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { revisions },
          "Quotation revisions fetched successfully",
        ),
      );
  });

  public updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const { status } = req.body;
    if (!status || !Object.values(QuotationStatus).includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Valid status is required");
    }

    const updated = await this.quotationService.updateQuotationStatus(
      quotationId,
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

  public cancel = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    if (req.body && Object.keys(req.body).length > 0) {
      validateBody(cancelQuotationSchema, req.body);
    }

    const cancelled = await this.quotationService.cancelQuotation(quotationId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation: cancelled },
          "Quotation cancelled successfully",
        ),
      );
  });

  public reject = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    if (req.body && Object.keys(req.body).length > 0) {
      validateBody(rejectQuotationSchema, req.body);
    }

    const rejected = await this.quotationService.rejectQuotation(quotationId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation: rejected },
          "Quotation rejected successfully",
        ),
      );
  });
}

export const quotationController = new QuotationController();
