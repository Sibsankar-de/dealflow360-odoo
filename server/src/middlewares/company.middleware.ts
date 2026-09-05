import { Request, Response, NextFunction } from "express";
import { CompanyStatus, CompanyUserRole } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiErrorHandler";
import { prisma as defaultPrisma } from "../lib/prisma";
import {
  CompanyRepository,
  companyRepository as defaultCompanyRepo,
} from "../repositories/company.repository";

export class CompanyMiddleware {
  private companyRepo: CompanyRepository;

  public constructor(companyRepo: CompanyRepository = defaultCompanyRepo) {
    this.companyRepo = companyRepo;
  }

  public verifyCompanyAccess = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
      }

      const headerCompanyId = Array.isArray(req.headers["x-company-id"])
        ? req.headers["x-company-id"][0]
        : req.headers["x-company-id"];

      let rawCompanyId =
        req.params?.companyId ||
        headerCompanyId ||
        req.body?.companyId ||
        (typeof req.query?.companyId === "string" ? req.query.companyId : undefined) ||
        req.params?.id;

      if (!rawCompanyId && req.body?.dealId) {
        const dealId = req.body.dealId;
        const deal = await defaultPrisma.deal.findUnique({
          where: { id: dealId },
        });
        if (deal) {
          rawCompanyId = deal.companyId;
        }
      }

      if (
        !rawCompanyId ||
        typeof rawCompanyId !== "string" ||
        rawCompanyId.trim() === ""
      ) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Company ID is required");
      }

      const companyId = rawCompanyId.trim();
      const company = await this.companyRepo.findById(companyId);

      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      if (
        company.status === CompanyStatus.SUSPENDED ||
        company.status === CompanyStatus.DELETED
      ) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          `Company is ${company.status.toLowerCase()} and cannot be accessed`,
        );
      }

      const isOwner = company.ownerId === req.user.id;
      const membership = await this.companyRepo.findCompanyUser(
        company.id,
        req.user.id,
      );

      if (!membership && !isOwner) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You do not have access to this company",
        );
      }

      const role: CompanyUserRole = isOwner
        ? CompanyUserRole.ADMIN
        : membership!.role;

      req.company = company;
      req.companyUser = membership ?? null;
      req.companyRole = role;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const companyMiddleware = new CompanyMiddleware();
export const verifyCompanyAccess = companyMiddleware.verifyCompanyAccess;
