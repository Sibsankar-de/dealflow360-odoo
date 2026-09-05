import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponseHandler";
import { ApiError } from "../utils/apiErrorHandler";
import { validateBody } from "../utils/validate.utils";
import {
  CompanyService,
  companyService as defaultCompanyService,
} from "../services/company.service";
import {
  createCompanySchema,
  updateCompanySchema,
  addCompanyUserSchema,
  updateCompanyUserRoleSchema,
} from "../schemas/company.schema";

export class CompanyController {
  private companyService: CompanyService;

  public constructor(companyService: CompanyService = defaultCompanyService) {
    this.companyService = companyService;
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const validated = validateBody(createCompanySchema, req.body);
    const company = await this.companyService.createCompany(userId, validated);

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { company },
          "Company created successfully",
        ),
      );
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company ID is required");
    }

    const company = await this.companyService.getCompanyById(id as string, userId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { company },
          "Company fetched successfully",
        ),
      );
  });

  public getUserCompanies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const companies = await this.companyService.getUserCompanies(userId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { companies },
          "User companies fetched successfully",
        ),
      );
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company ID is required");
    }

    const validated = validateBody(updateCompanySchema, req.body);
    const updatedCompany = await this.companyService.updateCompany(
      id as string,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { company: updatedCompany },
          "Company updated successfully",
        ),
      );
  });

  public listMembers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company ID is required");
    }

    const members = await this.companyService.listCompanyUsers(id as string, userId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { members },
          "Company members fetched successfully",
        ),
      );
  });

  public addMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company ID is required");
    }

    const validated = validateBody(addCompanyUserSchema, req.body);
    const member = await this.companyService.addCompanyUser(
      id as string,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          { member },
          "Member added to company successfully",
        ),
      );
  });

  public updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Company ID is required");
    }

    const validated = validateBody(updateCompanyUserRoleSchema, req.body);
    const updatedMember = await this.companyService.updateCompanyUserRole(
      id as string,
      userId,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { member: updatedMember },
          "Member role updated successfully",
        ),
      );
  });

  public removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const { id, userId: targetUserId } = req.params;
    if (!id || !targetUserId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Company ID and User ID are required",
      );
    }

    await this.companyService.removeCompanyUser(id as string, targetUserId as string, userId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          null,
          "Member removed from company successfully",
        ),
      );
  });
}

export const companyController = new CompanyController();
