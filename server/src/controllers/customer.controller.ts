import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import {
  CustomerService,
  customerService as defaultCustomerService,
} from "../services/customer.service";
import { customerListQuerySchema } from "../schemas/customer.schema";

export class CustomerController {
  private customerService: CustomerService;

  public constructor(
    customerService: CustomerService = defaultCustomerService,
  ) {
    this.customerService = customerService;
  }

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
