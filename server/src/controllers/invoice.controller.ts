import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  InvoiceService,
  invoiceService as defaultInvoiceService,
} from "../services/invoice.service";
import {
  createInvoiceSchema,
  recordInvoicePaymentSchema,
  invoiceFilterSchema,
} from "../schemas/invoice.schema";

export class InvoiceController {
  private invoiceService: InvoiceService;

  public constructor(
    invoiceService: InvoiceService = defaultInvoiceService,
  ) {
    this.invoiceService = invoiceService;
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

    const validated = validateBody(createInvoiceSchema, req.body);
    const invoice = await this.invoiceService.createInvoice(
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { invoice },
          "Invoice created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const invoiceId = String(req.params.id || req.params.invoiceId || "");
    if (!invoiceId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invoice ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const invoice = await this.invoiceService.getInvoiceById(
      invoiceId,
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { invoice },
          "Invoice fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = invoiceFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.invoiceService.listInvoices(
      companyId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Invoices fetched successfully",
        ),
      );
  });

  public pay = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const invoiceId = String(req.params.id || req.params.invoiceId || "");
    if (!invoiceId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invoice ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = validateBody(recordInvoicePaymentSchema, req.body);
    const invoice = await this.invoiceService.recordPayment(
      companyId,
      invoiceId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { invoice },
          "Payment recorded successfully",
        ),
      );
  });
}

export const invoiceController = new InvoiceController();
