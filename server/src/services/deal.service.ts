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
import {
  CreateDealDto,
  UpdateDealDto,
  DealFilterDto,
  CustomerDealFilterDto,
  DealResponseDto,
  toDealDto,
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
