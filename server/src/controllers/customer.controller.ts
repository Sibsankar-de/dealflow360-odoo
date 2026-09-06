import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  CustomerService,
  customerService as defaultCustomerService,
} from "../services/customer.service";
import {
  customerListQuerySchema,
  createCustomerSchema,
} from "../schemas/customer.schema";
import { searchCustomersInElasticsearch } from "../services/elasticsearch.service";

export class CustomerController {
  private customerService: CustomerService;

  public constructor(
    customerService: CustomerService = defaultCustomerService,
  ) {
    this.customerService = customerService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(createCustomerSchema, req.body);
    const customer = await this.customerService.addCustomer(
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { customer },
          "Customer added successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const parsed = customerListQuerySchema.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    const result = await this.customerService.listCustomers(
      req.company.id,
      filters,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Customers fetched successfully",
        ),
      );
  });

  public search = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const query =
      (req.query.query as string) || (req.query.search as string) || "";
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const customers = await searchCustomersInElasticsearch(
      req.company.id,
      query,
      isNaN(limit) || limit <= 0 ? 10 : limit,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          customers,
          "Customers searched successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const customerId = (req.params.customerId || req.params.id) as string;
    if (!customerId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Customer ID is required");
    }

    const customer = await this.customerService.getCustomer(
      req.company.id,
      customerId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { customer },
          "Customer fetched successfully",
        ),
      );
  });
}

export const customerController = new CustomerController();
