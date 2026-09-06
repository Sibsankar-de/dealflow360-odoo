import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CompanyUserRole } from "@prisma/client";
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

    if (
      req.companyRole === CompanyUserRole.CUSTOMER &&
      invoice.customerId !== req.user?.id
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view this invoice",
      );
    }

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

    const isCustomer = req.companyRole === CompanyUserRole.CUSTOMER;
    const customerId = isCustomer
      ? req.user?.id
      : filterResult.data.customerId;

    const result = await this.invoiceService.listInvoices(
      companyId,
      {
        ...filterResult.data,
        ...(customerId ? { customerId } : {}),
      },
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

    if (req.companyRole === CompanyUserRole.CUSTOMER) {
      const invoice = await this.invoiceService.getInvoiceById(
        invoiceId,
        companyId,
      );
      if (invoice.customerId !== userId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You can only pay invoices issued to your account",
        );
      }
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

  public getSummary = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const isCustomer = req.companyRole === CompanyUserRole.CUSTOMER;
    const customerId = isCustomer
      ? req.user?.id
      : typeof req.query.customerId === "string"
      ? req.query.customerId
      : undefined;

    const summary = await this.invoiceService.getInvoiceSummary(
      companyId,
      customerId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          summary,
          "Invoice summary fetched successfully",
        ),
      );
  });
}

export const invoiceController = new InvoiceController();
