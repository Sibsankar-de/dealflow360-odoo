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
  dealQuotationsQuerySchema,
  submitCounterOfferSchema,
  acceptQuotationSchema,
  approveQuotationSchema,
  fulfillQuotationSchema,
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
    const companyId =
      req.company?.id ||
      (typeof req.params.companyId === "string"
        ? req.params.companyId
        : undefined) ||
      validated.companyId;

    const quotation = await this.quotationService.createQuotation(userId, {
      ...validated,
      companyId,
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

    const companyIdParam =
      typeof req.params.companyId === "string"
        ? req.params.companyId
        : undefined;
    const companyId = companyIdParam || filterResult.data.companyId;

    const result = await this.quotationService.listQuotations(userId, {
      ...filterResult.data,
      ...(companyId ? { companyId } : {}),
    });

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

  public listByDeal = asyncHandler(async (req: Request, res: Response) => {
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

    const companyId =
      req.company?.id ||
      (typeof req.params.companyId === "string"
        ? req.params.companyId
        : undefined);

    const result = await this.quotationService.listQuotationsByDeal(
      dealId,
      filterResult.data,
      companyId,
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

  public customerApprove = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const companyId =
      req.company?.id ||
      (typeof req.params.companyId === "string"
        ? req.params.companyId
        : undefined);

    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated =
      req.body && Object.keys(req.body).length > 0
        ? validateBody(acceptQuotationSchema, req.body)
        : {};

    const quotation = await this.quotationService.customerApproveQuotation(
      companyId,
      quotationId,
      userId,
      validated.notes,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation },
          "Quotation approved and accepted successfully by customer",
        ),
      );
  });

  public accept = this.customerApprove;

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

    let validatedDto;
    if (req.body && Object.keys(req.body).length > 0) {
      validatedDto = validateBody(rejectQuotationSchema, req.body);
    }

    const rejected = await this.quotationService.rejectQuotation(
      quotationId,
      req.user?.id,
      validatedDto,
    );

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

  public counterOffer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const validated = validateBody(submitCounterOfferSchema, req.body);
    const quotation = await this.quotationService.submitCounterOffer(
      quotationId,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation },
          "Counter-offer submitted successfully",
        ),
      );
  });

  public getNegotiations = asyncHandler(async (req: Request, res: Response) => {
    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const negotiations =
      await this.quotationService.getQuotationNegotiations(quotationId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { negotiations },
          "Quotation negotiations fetched successfully",
        ),
      );
  });

  public getDiscountEvaluation = asyncHandler(
    async (req: Request, res: Response) => {
      const quotationId = req.params.quotationId || req.params.id;
      if (!quotationId || typeof quotationId !== "string") {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
      }

      const evaluation =
        await this.quotationService.evaluateDiscountViolations(quotationId);

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            { evaluation },
            "Discount violation evaluation calculated successfully",
          ),
        );
    },
  );

  public approve = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const reviewerRole = req.companyRole;
    if (!reviewerRole) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "No company role found for user",
      );
    }

    const validated = req.body && Object.keys(req.body).length > 0
      ? validateBody(approveQuotationSchema, req.body)
      : {};
    const quotation = await this.quotationService.approveQuotation(
      companyId,
      quotationId,
      userId,
      reviewerRole,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { quotation },
          "Quotation approved successfully",
        ),
      );
  });

  public fulfill = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const quotationId = req.params.quotationId || req.params.id;
    if (!quotationId || typeof quotationId !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Quotation ID is required");
    }

    const validated = req.body && Object.keys(req.body).length > 0
      ? validateBody(fulfillQuotationSchema, req.body)
      : {};
    const result = await this.quotationService.fulfillQuotation(
      companyId,
      quotationId,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Quotation fulfillment processed successfully",
        ),
      );
  });
}

export const quotationController = new QuotationController();
