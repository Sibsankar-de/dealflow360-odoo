import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  AuthService,
  authService as defaultAuthService,
} from "../services/auth.service";
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from "../schemas/user.schema";
import {
  accessTokenCookieOptions,
  cookieOptions,
  refreshTokenCookieOptions,
} from "../utils/cookie-utils";

export class AuthController {
  private authService: AuthService;

  public constructor(authService: AuthService = defaultAuthService) {
    this.authService = authService;
  }

  public register = asyncHandler(async (req: Request, res: Response) => {
    const validated = validateBody(registerUserSchema, req.body);
    const result = await this.authService.register(validated);

    return res
      .status(StatusCodes.CREATED)
      .cookie("accessToken", result.accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { user: result.user },
          "User registered successfully",
        ),
      );
  });

  public login = asyncHandler(async (req: Request, res: Response) => {
    const validated = validateBody(loginUserSchema, req.body);
    const result = await this.authService.login(validated);

    return res
      .status(StatusCodes.OK)
      .cookie("accessToken", result.accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { user: result.user },
          "Logged in successfully",
        ),
      );
  });

  public logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    const userId = req.user?.id;

    if (userId) {
      await this.authService.logout(userId, refreshToken);
    }

    return res
      .status(StatusCodes.OK)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(StatusCodes.OK, null, "Logged out successfully"));
  });

  public getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const user = await this.authService.getCurrentUser(userId);
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, { user }, "User fetched successfully"),
      );
  });

  public refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required");
    }

    const result = await this.authService.refreshSession(refreshToken);

    return res
      .status(StatusCodes.OK)
      .cookie("accessToken", result.accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Session refreshed successfully"),
      );
  });

  public updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const validated = validateBody(updateUserSchema, req.body);
    const updatedUser = await this.authService.updateUser(userId, validated);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { user: updatedUser },
          "Profile updated successfully",
        ),
      );
  });

  public updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const validated = validateBody(updatePasswordSchema, req.body);
    await this.authService.updatePassword(userId, validated);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Password updated successfully"),
      );
  });
}

export const authController = new AuthController();
