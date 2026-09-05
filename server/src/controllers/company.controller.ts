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
  listCompaniesQuerySchema,
} from "../schemas/company.schema";
import { updateCompanySettingSchema } from "../schemas/companySetting.schema";

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
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const company = this.companyService.getCompanyDetails(
      req.company,
      req.companyRole,
    );

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

  public list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const filterResult = listCompaniesQuerySchema.safeParse(req.query);
    if (!filterResult.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid query parameters",
        filterResult.error.errors,
      );
    }

    const result = await this.companyService.listCompanies(
      userId,
      filterResult.data,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          "Companies fetched successfully",
        ),
      );
  });

  public getUserCompanies = asyncHandler(
    async (req: Request, res: Response) => {
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
    },
  );

  public listCompanyRoles = asyncHandler(
    async (_req: Request, res: Response) => {
      const roles = this.companyService.getCompanyRoles();

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            { roles },
            "Company roles fetched successfully",
          ),
        );
    },
  );


  public update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(updateCompanySchema, req.body);
    const updatedCompany = await this.companyService.updateCompany(
      req.company,
      validated,
      req.companyRole,
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
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const members = await this.companyService.listCompanyUsers(req.company.id);

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
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(addCompanyUserSchema, req.body);
    const member = await this.companyService.addCompanyUser(
      req.company.id,
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

  public updateMemberRole = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      const validated = validateBody(updateCompanyUserRoleSchema, req.body);
      const updatedMember = await this.companyService.updateCompanyUserRole(
        req.company,
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
    },
  );

  public removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const { userId: targetUserId } = req.params;
    if (!targetUserId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Company ID and User ID are required",
      );
    }

    await this.companyService.removeCompanyUser(
      req.company,
      targetUserId as string,
      userId,
      req.companyRole,
    );

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

  public getSettings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const settings = await this.companyService.getCompanySettings(
      req.company.id,
      req.company.settings,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { settings },
          "Company settings fetched successfully",
        ),
      );
  });

  public updateSettings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const validated = validateBody(updateCompanySettingSchema, req.body);
    const settings = await this.companyService.updateCompanySettings(
      req.company.id,
      validated,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { settings },
          "Company settings updated successfully",
        ),
      );
  });
}

export const companyController = new CompanyController();
