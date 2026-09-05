import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { User } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiErrorHandler";
import {
  JwtService,
  jwtService as defaultJwtService,
} from "../services/jwt.service";
import {
  AuthService,
  authService as defaultAuthService,
} from "../services/auth.service";
import {
  UserRepository,
  userRepository as defaultUserRepo,
} from "../repositories/user.repository";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/cookie-utils";

export class AuthMiddleware {
  private jwt: JwtService;
  private authService: AuthService;
  private userRepo: UserRepository;

  public constructor(
    jwt: JwtService = defaultJwtService,
    authService: AuthService = defaultAuthService,
    userRepo: UserRepository = defaultUserRepo,
  ) {
    this.jwt = jwt;
    this.authService = authService;
    this.userRepo = userRepo;
  }

  public verifyAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : authHeader.trim();
        req.user = await this.verifyViaBearer(token);
      } else {
        req.user = await this.verifyViaCookie(req, res);
      }

      if (!req.user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  private async verifyViaBearer(token: string): Promise<User> {
    if (!token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Token is required");
    }

    try {
      const payload = this.jwt.verifyAccessToken(token) as JwtPayload;
      if (!payload || !payload.id) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid access token");
      }
      const user = await this.userRepo.findById(payload.id);
      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
      }
      return user;
    } catch {
      // Fallback to checking active auth tokens table if applicable
      return this.authService.verifyAuthToken(token);
    }
  }

  private async verifyViaCookie(req: Request, res: Response): Promise<User> {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request");
    }

    let user: User | null = null;

    try {
      if (!accessToken) {
        throw new Error("No access token present");
      }
      const payload = this.jwt.verifyAccessToken(accessToken) as JwtPayload;
      if (!payload || !payload.id) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid access token");
      }
      user = await this.userRepo.findById(payload.id);
    } catch {
      if (!refreshToken) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid access token");
      }

      const refreshed = await this.authService.refreshSession(refreshToken);
      res.cookie(
        "accessToken",
        refreshed.accessToken,
        accessTokenCookieOptions,
      );
      res.cookie(
        "refreshToken",
        refreshed.refreshToken,
        refreshTokenCookieOptions,
      );
      user = refreshed.user;
    }

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
    }

    return user;
  }
}

export const authMiddleware = new AuthMiddleware();
export const verifyAuth = authMiddleware.verifyAuth;
