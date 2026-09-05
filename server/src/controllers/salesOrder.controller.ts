import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  SalesOrderService,
  salesOrderService as defaultSalesOrderService,
} from "../services/salesOrder.service";
import {
  createSalesOrderSchema,
  salesOrderFilterSchema,
  deliverOrderSchema,
} from "../schemas/salesOrder.schema";

export class SalesOrderController {
  private salesOrderService: SalesOrderService;

  public constructor(
    salesOrderService: SalesOrderService = defaultSalesOrderService,
  ) {
    this.salesOrderService = salesOrderService;
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

    const validated = validateBody(createSalesOrderSchema, req.body);
    const order = await this.salesOrderService.createSalesOrder(
      companyId,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { order },
          "Sales order created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id || req.params.orderId;
    if (!orderId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Order ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const order = await this.salesOrderService.getOrderById(orderId, companyId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { order },
          "Sales order fetched successfully",
        ),
      );
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = salesOrderFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.salesOrderService.listOrders(
      companyId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Sales orders fetched successfully",
        ),
      );
  });

  public deliver = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const orderId = req.params.id || req.params.orderId;
    if (!orderId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Order ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = validateBody(deliverOrderSchema, req.body);
    const delivery = await this.salesOrderService.deliverOrder(
      companyId,
      userId,
      orderId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { delivery },
          "Delivery processed successfully",
        ),
      );
  });
}

export const salesOrderController = new SalesOrderController();
