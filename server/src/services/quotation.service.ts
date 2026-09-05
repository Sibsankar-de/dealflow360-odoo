import { Prisma, QuotationStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  QuotationRepository,
  quotationRepository as defaultQuotationRepository,
} from "../repositories/quotation.repository";
import {
  CompanyRepository,
  companyRepository as defaultCompanyRepository,
} from "../repositories/company.repository";
import {
  UserRepository,
  userRepository as defaultUserRepository,
} from "../repositories/user.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prismaTransaction, TransactionClient } from "../utils/transactionHandler";
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QuotationResponseDto,
  QuotationFilterDto,
  toQuotationDto,
} from "../dto/quotation.dto";

export class QuotationService {
  private quotationRepo: QuotationRepository;
  private companyRepo: CompanyRepository;
  private userRepo: UserRepository;

  public constructor(
    quotationRepo: QuotationRepository = defaultQuotationRepository,
    companyRepo: CompanyRepository = defaultCompanyRepository,
    userRepo: UserRepository = defaultUserRepository,
  ) {
    this.quotationRepo = quotationRepo;
    this.companyRepo = companyRepo;
    this.userRepo = userRepo;
  }

  public async createQuotation(
    creatorUserId: string,
    dto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const creator = await this.userRepo.findById(creatorUserId, tx);
      if (!creator) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Creator user not found");
      }

      const company = await this.companyRepo.findById(dto.companyId, false, tx);
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      // Verify target customer exists
      const customer = await this.userRepo.findById(dto.customerId, tx);
      if (!customer) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
      }

      // Fetch and validate all products
      const productIds = dto.items.map((item) => item.productId);
      const products = await this.quotationRepo.findProductsByIds(
        productIds,
        dto.companyId,
        tx,
      );

      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of dto.items) {
        if (!productMap.has(item.productId)) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Product ${item.productId} not found or does not belong to the company`,
          );
        }
      }

      // Calculate line items and totals
      const { itemsToCreate, subtotal, totalDiscount, total } =
        this.calculateQuotationTotals(dto.items, productMap, dto.discountAmount);

      const count = await this.quotationRepo.countCompanyQuotations(
        dto.companyId,
        tx,
      );

      const quotationDate = dto.quotationDate
        ? new Date(dto.quotationDate)
        : new Date();

      const expiresAt = dto.expiresAt !== undefined
        ? (dto.expiresAt ? new Date(dto.expiresAt) : null)
        : new Date(quotationDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const year = quotationDate.getFullYear();
      const month = String(quotationDate.getMonth() + 1).padStart(2, "0");
      const seq = String(count + 1).padStart(4, "0");
      const quotationNumber = `QT-${year}${month}-${seq}`;

      const quotation = await this.quotationRepo.create(
        {
          companyId: dto.companyId,
          creatorId: creatorUserId,
          customerId: dto.customerId,
          quotationNumber,
          status: dto.status || QuotationStatus.DRAFT,
          quotationDate,
          expiresAt,
          currency: dto.currency || company.currency || "USD",
          discountAmount: totalDiscount,
          subtotal,
          total,
          notes: dto.notes || null,
        },
        itemsToCreate,
        tx,
      );

      return toQuotationDto(quotation);
    });
  }

  public async getQuotationById(
    quotationId: string,
    requestingUserId: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    await this.assertQuotationAccess(quotation, requestingUserId);

    return toQuotationDto(quotation);
  }

  public async listQuotations(
    requestingUserId: string,
    filters: QuotationFilterDto,
  ): Promise<{ quotations: QuotationResponseDto[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.QuotationWhereInput = {};

    if (filters.companyId) {
      const company = await this.companyRepo.findById(filters.companyId);
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      const membership = await this.companyRepo.findCompanyUser(
        filters.companyId,
        requestingUserId,
      );

      if (!membership && company.ownerId !== requestingUserId) {
        // If not a company member, check if customer has received quotations
        where.companyId = filters.companyId;
        where.customerId = requestingUserId;
      } else {
        where.companyId = filters.companyId;
      }
    } else {
      // Find companies where user is member
      const memberships = await this.companyRepo.findUserCompanies(requestingUserId);
      const companyIds = memberships.map((m) => m.company.id);

      where.OR = [
        { creatorId: requestingUserId },
        { customerId: requestingUserId },
        { companyId: { in: companyIds } },
      ];
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { quotationNumber: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const { quotations, total } = await this.quotationRepo.findMany(where, page, limit);

    return {
      quotations: quotations.map(toQuotationDto),
      total,
      page,
      limit,
    };
  }

  public async updateQuotation(
    quotationId: string,
    requestingUserId: string,
    dto: UpdateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (
        quotation.status !== QuotationStatus.DRAFT &&
        quotation.status !== QuotationStatus.UNDER_NEGOTIATION
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot edit a quotation in status ${quotation.status}`,
        );
      }

      if (dto.customerId) {
        const customer = await this.userRepo.findById(dto.customerId, tx);
        if (!customer) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
        }
      }

      let itemsToCreate;
      let subtotal = quotation.subtotal;
      let totalDiscount = quotation.discountAmount;
      let total = quotation.total;

      if (dto.items && dto.items.length > 0) {
        const productIds = dto.items.map((item) => item.productId);
        const products = await this.quotationRepo.findProductsByIds(
          productIds,
          quotation.companyId,
          tx,
        );

        const productMap = new Map(products.map((p) => [p.id, p]));
        for (const item of dto.items) {
          if (!productMap.has(item.productId)) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              `Product ${item.productId} not found or does not belong to the company`,
            );
          }
        }

        const calculated = this.calculateQuotationTotals(
          dto.items,
          productMap,
          dto.discountAmount,
        );

        itemsToCreate = calculated.itemsToCreate;
        subtotal = calculated.subtotal;
        totalDiscount = calculated.totalDiscount;
        total = calculated.total;

        await this.quotationRepo.deleteItemsByQuotationId(quotationId, tx);
      }

      const updateData: Prisma.QuotationUpdateInput = {
        ...(dto.customerId ? { customer: { connect: { id: dto.customerId } } } : {}),
        ...(dto.quotationDate ? { quotationDate: new Date(dto.quotationDate) } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        subtotal,
        discountAmount: totalDiscount,
        total,
      };

      if (itemsToCreate) {
        updateData.items = {
          create: itemsToCreate.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage,
            taxPercentage: item.taxPercentage,
            lineTotal: item.lineTotal,
          })),
        };
      }

      const updated = await this.quotationRepo.update(quotationId, updateData, tx);
      return toQuotationDto(updated);
    });
  }

  public async updateQuotationStatus(
    quotationId: string,
    requestingUserId: string,
    status: QuotationStatus,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      // Customer status transitions
      if (quotation.customerId === requestingUserId) {
        if (
          status !== QuotationStatus.ACCEPTED &&
          status !== QuotationStatus.REJECTED &&
          status !== QuotationStatus.UNDER_NEGOTIATION
        ) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Customer can only ACCEPT, REJECT, or mark quotation UNDER_NEGOTIATION",
          );
        }
      }

      const updated = await this.quotationRepo.updateStatus(quotationId, status, tx);
      return toQuotationDto(updated);
    });
  }

  private calculateQuotationTotals(
    items: CreateQuotationDto["items"],
    productMap: Map<string, { id: string; price: Prisma.Decimal }>,
    extraDiscountAmount: number = 0,
  ): {
    itemsToCreate: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountPercentage: Prisma.Decimal;
      taxPercentage: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }>;
    subtotal: Prisma.Decimal;
    totalDiscount: Prisma.Decimal;
    total: Prisma.Decimal;
  } {
    let subtotalNum = 0;
    let itemDiscountSum = 0;
    let totalNum = 0;
    const itemsToCreate = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPriceNum =
        item.unitPrice !== undefined ? Number(item.unitPrice) : Number(product.price);
      const quantityNum = Number(item.quantity);
      const discountPct = Number(item.discountPercentage || 0);
      const taxPct = Number(item.taxPercentage || 0);

      const lineGross = quantityNum * unitPriceNum;
      const lineDisc = lineGross * (discountPct / 100);
      const lineTaxable = lineGross - lineDisc;
      const lineTax = lineTaxable * (taxPct / 100);
      const lineTotalNum = lineTaxable + lineTax;

      subtotalNum += lineGross;
      itemDiscountSum += lineDisc;
      totalNum += lineTotalNum;

      return {
        productId: item.productId,
        quantity: new Prisma.Decimal(quantityNum.toFixed(2)),
        unitPrice: new Prisma.Decimal(unitPriceNum.toFixed(2)),
        discountPercentage: new Prisma.Decimal(discountPct.toFixed(2)),
        taxPercentage: new Prisma.Decimal(taxPct.toFixed(2)),
        lineTotal: new Prisma.Decimal(lineTotalNum.toFixed(2)),
      };
    });

    const finalTotalDiscountNum = itemDiscountSum + (extraDiscountAmount || 0);
    const finalTotalNum = Math.max(0, totalNum - (extraDiscountAmount || 0));

    return {
      itemsToCreate,
      subtotal: new Prisma.Decimal(subtotalNum.toFixed(2)),
      totalDiscount: new Prisma.Decimal(finalTotalDiscountNum.toFixed(2)),
      total: new Prisma.Decimal(finalTotalNum.toFixed(2)),
    };
  }

  private async assertQuotationAccess(
    quotation: {
      companyId: string;
      creatorId: string;
      customerId: string;
      company: { ownerId: string };
    },
    userId: string,
  ): Promise<void> {
    if (quotation.creatorId === userId || quotation.customerId === userId) {
      return;
    }

    if (quotation.company.ownerId === userId) {
      return;
    }

    const membership = await this.companyRepo.findCompanyUser(
      quotation.companyId,
      userId,
    );

    if (!membership) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You do not have access to view this quotation",
      );
    }
  }
}

export const quotationService = new QuotationService();
