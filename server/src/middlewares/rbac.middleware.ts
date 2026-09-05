import { Request, Response, NextFunction } from "express";
import { CompanyUserRole, UserRole } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiErrorHandler";

export class RbacMiddleware {
  public requireRole = (
    ...allowedRoles: (CompanyUserRole | CompanyUserRole[])[]
  ) => {
    const flattenedRoles = allowedRoles.flat();

    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        const isOwner = Boolean(
          req.company && req.user && req.company.ownerId === req.user.id,
        );
        const userRole =
          req.companyRole ||
          (isOwner ? CompanyUserRole.ADMIN : req.companyUser?.role);

        if (!userRole && !isOwner) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "Access denied: company role could not be determined",
          );
        }

        const isAdmin = userRole === CompanyUserRole.ADMIN || isOwner;
        if (isAdmin || (userRole && flattenedRoles.includes(userRole))) {
          return next();
        }

        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Access denied: insufficient permissions for this operation",
        );
      } catch (error) {
        next(error);
      }
    };
  };

  public requirePlatformRole = (
    ...allowedRoles: (UserRole | UserRole[])[]
  ) => {
    const flattenedRoles = allowedRoles.flat();

    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "User not authenticated",
          );
        }

        if (
          req.user.role === UserRole.ADMIN ||
          flattenedRoles.includes(req.user.role)
        ) {
          return next();
        }

        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Access denied: insufficient platform permissions",
        );
      } catch (error) {
        next(error);
      }
    };
  };
}

export const rbacMiddleware = new RbacMiddleware();
export const requireRole = rbacMiddleware.requireRole;
export const requireCompanyRole = rbacMiddleware.requireRole;
export const requirePlatformRole = rbacMiddleware.requirePlatformRole;
