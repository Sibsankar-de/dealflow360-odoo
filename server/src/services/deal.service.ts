import { Prisma, DealStage, DealStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  DealRepository,
  dealRepository as defaultDealRepository,
} from "../repositories/deal.repository";
import {
  CompanyRepository,
  companyRepository as defaultCompanyRepository,
} from "../repositories/company.repository";
import {
  UserRepository,
  userRepository as defaultUserRepository,
} from "../repositories/user.repository";
import { ApiError } from "../utils/apiErrorHandler";
import {
  prismaTransaction,
  TransactionClient,
} from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import { prisma } from "../lib/prisma";
import {
  CreateDealDto,
  UpdateDealDto,
  DealFilterDto,
  CustomerDealFilterDto,
  DealHealthQueryDto,
  DealHealthResponseDto,
  DealResponseDto,
  toDealDto,
  toDealHealthAlertDto,
} from "../dto/deal.dto";

export class DealService {
  private dealRepo: DealRepository;
  private companyRepo: CompanyRepository;
  private userRepo: UserRepository;

  public constructor(
    dealRepo: DealRepository = defaultDealRepository,
    companyRepo: CompanyRepository = defaultCompanyRepository,
    userRepo: UserRepository = defaultUserRepository,
  ) {
    this.dealRepo = dealRepo;
    this.companyRepo = companyRepo;
    this.userRepo = userRepo;
  }

  public async createDeal(
    companyId: string,
    salesRepUserId: string,
    dto: CreateDealDto,
  ): Promise<DealResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const company = await this.companyRepo.findById(companyId, false, tx);
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      const customer = await this.userRepo.findById(dto.customerId, tx);
      if (!customer) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
      }

      const salesRepId = dto.salesRepId || salesRepUserId;
      const salesRep = await this.userRepo.findById(salesRepId, tx);
      if (!salesRep) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Sales representative not found",
        );
      }

      const dealNo = await this.generateDealNo(companyId, tx);

      const deal = await this.dealRepo.create(
        {
          companyId,
          customerId: dto.customerId,
          salesRepId,
          dealNo,
          name: dto.name,
          expectedValue: new Prisma.Decimal(
            ((dto.expectedValue as number | undefined) ?? 0).toFixed(2),
          ),
          probability: new Prisma.Decimal(
            ((dto.probability as number | undefined) ?? 0).toFixed(2),
          ),
          expectedCloseDate: dto.expectedCloseDate
            ? new Date(dto.expectedCloseDate)
            : null,
          source: dto.source ?? null,
          stage: DealStage.NEW,
          status: DealStatus.OPEN,
        },
        tx,
      );

      return toDealDto(deal);
    });
  }

  public async getDealById(dealId: string): Promise<DealResponseDto> {
    const deal = await this.dealRepo.findById(dealId);
    if (!deal) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Deal not found");
    }

    return toDealDto(deal);
  }

  public async updateDeal(
    dealId: string,
    dto: UpdateDealDto,
  ): Promise<DealResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const deal = await this.dealRepo.findById(dealId, tx);
      if (!deal) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Deal not found");
      }

      if (
        deal.status === DealStatus.WON ||
        deal.status === DealStatus.LOST ||
        deal.status === DealStatus.CANCELLED
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot edit a deal with status ${deal.status}`,
        );
      }

      if (dto.customerId) {
        const customer = await this.userRepo.findById(dto.customerId, tx);
        if (!customer) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
        }
      }

      if (dto.salesRepId) {
        const salesRep = await this.userRepo.findById(dto.salesRepId, tx);
        if (!salesRep) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Sales representative not found",
          );
        }
      }

      const updateData: Prisma.DealUpdateInput = {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.customerId
          ? { customer: { connect: { id: dto.customerId } } }
          : {}),
        ...(dto.salesRepId
          ? { salesRep: { connect: { id: dto.salesRepId } } }
          : {}),
        ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.expectedValue !== undefined
          ? {
              expectedValue: new Prisma.Decimal(
                dto.expectedValue.toFixed(2),
              ),
            }
          : {}),
        ...(dto.probability !== undefined
          ? {
              probability: new Prisma.Decimal(dto.probability.toFixed(2)),
            }
          : {}),
        ...(dto.expectedCloseDate !== undefined
          ? {
              expectedCloseDate: dto.expectedCloseDate
                ? new Date(dto.expectedCloseDate)
                : null,
            }
          : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
      };

      const updated = await this.dealRepo.update(dealId, updateData, tx);
      return toDealDto(updated);
    });
  }

  public async listDeals(
    companyId: string,
    filters: DealFilterDto,
  ): Promise<PaginatedResult<DealResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.DealWhereInput = { companyId };

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.salesRepId) {
      where.salesRepId = filters.salesRepId;
    }

    if (filters.stage) {
      where.stage = filters.stage;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { dealNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const result = await this.dealRepo.findMany(where, { page, limit });

    return {
      ...result,
      docs: result.docs.map(toDealDto),
    };
  }

  public async listCustomerDeals(
    customerId: string,
    filters: CustomerDealFilterDto,
  ): Promise<PaginatedResult<DealResponseDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.DealWhereInput = { customerId };

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.stage) {
      where.stage = filters.stage;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { dealNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const result = await this.dealRepo.findMany(where, { page, limit });

    return {
      ...result,
      docs: result.docs.map(toDealDto),
    };
  }

  public async getDealHealth(
    companyId: string,
    query: DealHealthQueryDto,
  ): Promise<DealHealthResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const now = new Date();

    const idleDays =
      query.idleDays ?? (query.idleMonths ? query.idleMonths * 30 : 30);
    const idleThreshold = new Date(
      now.getTime() - idleDays * 24 * 60 * 60 * 1000,
    );

    const expiringDays = query.expiringDays ?? 2;
    const expiringThreshold = new Date(
      now.getTime() + expiringDays * 24 * 60 * 60 * 1000,
    );

    const baseWhere: Prisma.DealWhereInput = {
      companyId,
      status: DealStatus.OPEN,
    };

    const riskType = query.riskType || "ALL";
    let riskFilter: Prisma.DealWhereInput = {};

    if (riskType === "IDLE") {
      riskFilter = {
        updatedAt: { lte: idleThreshold },
      };
    } else if (riskType === "EXPIRING_SOON") {
      riskFilter = {
        expectedCloseDate: {
          not: null,
          gte: now,
          lte: expiringThreshold,
        },
      };
    } else if (riskType === "EXPIRED") {
      riskFilter = {
        expectedCloseDate: {
          not: null,
          lt: now,
        },
      };
    } else {
      // "ALL"
      riskFilter = {
        OR: [
          { updatedAt: { lte: idleThreshold } },
          { expectedCloseDate: { not: null, lte: expiringThreshold } },
        ],
      };
    }

    const where: Prisma.DealWhereInput = {
      ...baseWhere,
      ...riskFilter,
    };

    if (query.search) {
      const searchTerms: Prisma.DealWhereInput[] = [
        { name: { contains: query.search, mode: "insensitive" } },
        { dealNo: { contains: query.search, mode: "insensitive" } },
        { customer: { userName: { contains: query.search, mode: "insensitive" } } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchTerms },
        ];
        delete where.OR;
      } else {
        where.AND = [{ OR: searchTerms }];
      }
    }

    const [
      paginatedDeals,
      stalledDealsCount,
      expiringDealsCount,
      expiredDealsCount,
      totalAtRiskCount,
      discountAnomaliesCount,
      deliveryRisksCount,
      highRiskApprovalsCount,
    ] = await Promise.all([
      this.dealRepo.findMany(where, { page, limit }),
      prisma.deal.count({
        where: {
          companyId,
          status: DealStatus.OPEN,
          updatedAt: { lte: idleThreshold },
        },
      }),
      prisma.deal.count({
        where: {
          companyId,
          status: DealStatus.OPEN,
          expectedCloseDate: {
            not: null,
            gte: now,
            lte: expiringThreshold,
          },
        },
      }),
      prisma.deal.count({
        where: {
          companyId,
          status: DealStatus.OPEN,
          expectedCloseDate: {
            not: null,
            lt: now,
          },
        },
      }),
      prisma.deal.count({
        where: {
          companyId,
          status: DealStatus.OPEN,
          OR: [
            { updatedAt: { lte: idleThreshold } },
            { expectedCloseDate: { not: null, lte: expiringThreshold } },
          ],
        },
      }),
      prisma.quotation.count({
        where: {
          companyId,
          status: { in: ["DRAFT", "NEGOTIATING"] },
        },
      }),
      prisma.backorder.count({
        where: {
          companyId,
          status: "PENDING",
        },
      }),
      prisma.quotation.count({
        where: {
          companyId,
          status: "NEGOTIATING",
        },
      }),
    ]);

    const docs = paginatedDeals.docs.map((deal) =>
      toDealHealthAlertDto(deal, now, idleDays, expiringDays),
    );

    return {
      docs,
      total: paginatedDeals.totalDocs,
      page: paginatedDeals.page,
      limit: paginatedDeals.limit,
      totalPages: paginatedDeals.totalPages,
      hasNextPage: paginatedDeals.hasNextPage,
      hasPrevPage: paginatedDeals.hasPrevPage,
      kpi: {
        stalledDealsCount,
        expiringDealsCount,
        expiredDealsCount,
        totalAtRiskCount,
        discountAnomaliesCount,
        deliveryRisksCount,
        highRiskApprovalsCount,
      },
    };
  }

  private async generateDealNo(
    companyId: string,
    tx: TransactionClient,
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.dealRepo.countByCompany(companyId, tx);
    let seqNum = count + 1;
    let dealNo = `DL-${year}${month}-${String(seqNum).padStart(4, "0")}`;

    while (await this.dealRepo.findByDealNo(dealNo, tx)) {
      seqNum += 1;
      dealNo = `DL-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }

    return dealNo;
  }
}

export const dealService = new DealService();
