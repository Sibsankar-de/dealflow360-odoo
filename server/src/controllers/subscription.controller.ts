import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  SubscriptionService,
  subscriptionService as defaultSubscriptionService,
} from "../services/subscription.service";
import {
  subscriptionFilterSchema,
  customerSubscriptionFilterSchema,
  renewSubscriptionSchema,
  cancelSubscriptionSchema,
} from "../schemas/subscription.schema";

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  public constructor(
    subscriptionService: SubscriptionService = defaultSubscriptionService,
  ) {
    this.subscriptionService = subscriptionService;
  }

  public list = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const filterResult = subscriptionFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.subscriptionService.listSubscriptions(
      companyId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Subscriptions fetched successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
    if (!subscriptionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const subscription = await this.subscriptionService.getSubscriptionById(
      subscriptionId,
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { subscription },
          "Subscription fetched successfully",
        ),
      );
  });

  public getSummary = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const summary = await this.subscriptionService.getSubscriptionSummary(
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          summary,
          "Subscription summary fetched successfully",
        ),
      );
  });

  public getHistory = asyncHandler(async (req: Request, res: Response) => {
    const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
    if (!subscriptionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const history = await this.subscriptionService.getSubscriptionPeriods(
      subscriptionId,
      companyId,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { history },
          "Subscription history fetched successfully",
        ),
      );
  });

  public renew = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
    if (!subscriptionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = req.body && Object.keys(req.body).length > 0
      ? validateBody(renewSubscriptionSchema, req.body)
      : undefined;

    const subscription = await this.subscriptionService.renewSubscription(
      subscriptionId,
      userId,
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { subscription },
          "Subscription renewed successfully",
        ),
      );
  });

  public cancel = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
    if (!subscriptionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
    }

    const companyId = req.company?.id;
    if (!companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company context is required");
    }

    const validated = req.body && Object.keys(req.body).length > 0
      ? validateBody(cancelSubscriptionSchema, req.body)
      : undefined;

    const subscription = await this.subscriptionService.cancelSubscription(
      subscriptionId,
      userId,
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { subscription },
          "Subscription cancelled successfully",
        ),
      );
  });

  // Customer portal endpoints
  public listCustomerSubscriptions = asyncHandler(
    async (req: Request, res: Response) => {
      const customerId = req.user?.id;
      if (!customerId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      }

      const companyId = req.params.companyId as string | undefined;
      const filterResult = customerSubscriptionFilterSchema.safeParse(req.query);
      if (!filterResult.success) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Invalid query parameters",
          filterResult.error.errors,
        );
      }

      const result = await this.subscriptionService.listCustomerSubscriptions(
        customerId,
        companyId,
        filterResult.data,
      );

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            result,
            "Customer subscriptions fetched successfully",
          ),
        );
    },
  );

  public getCustomerSubscriptionById = asyncHandler(
    async (req: Request, res: Response) => {
      const customerId = req.user?.id;
      if (!customerId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      }

      const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
      if (!subscriptionId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
      }

      const companyId = req.params.companyId as string | undefined;

      const subscription = await this.subscriptionService.getSubscriptionById(
        subscriptionId,
        companyId,
        customerId,
      );

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            { subscription },
            "Customer subscription fetched successfully",
          ),
        );
    },
  );

  public customerRenew = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    if (!customerId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
    if (!subscriptionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
    }

    const companyId = req.params.companyId as string | undefined;

    const validated = req.body && Object.keys(req.body).length > 0
      ? validateBody(renewSubscriptionSchema, req.body)
      : undefined;

    const subscription = await this.subscriptionService.renewSubscription(
      subscriptionId,
      customerId,
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { subscription },
          "Subscription renewed successfully",
        ),
      );
  });

  public customerCancel = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    if (!customerId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const subscriptionId = String(req.params.id || req.params.subscriptionId || "");
    if (!subscriptionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Subscription ID is required");
    }

    const companyId = req.params.companyId as string | undefined;

    const validated = req.body && Object.keys(req.body).length > 0
      ? validateBody(cancelSubscriptionSchema, req.body)
      : undefined;

    const subscription = await this.subscriptionService.cancelSubscription(
      subscriptionId,
      customerId,
      companyId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { subscription },
          "Subscription cancelled successfully",
        ),
      );
  });
}

export const subscriptionController = new SubscriptionController();
