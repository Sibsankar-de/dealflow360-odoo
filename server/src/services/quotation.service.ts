import {
  Prisma,
  QuotationStatus,
  DiscountType,
  RevisionType,
  RevisionStatus,
  DealStage,
  CompanyUserRole,
} from "@prisma/client";
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
import {
  prismaTransaction,
  TransactionClient,
} from "../utils/transactionHandler";
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QuotationResponseDto,
  QuotationRevisionResponseDto,
  QuotationFilterDto,
  CancelQuotationDto,
  RejectQuotationDto,
  toQuotationDto,
  toQuotationRevisionDto,
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
    salesRepUserId: string,
    dto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const salesRep = await this.userRepo.findById(salesRepUserId, tx);
      if (!salesRep) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Sales representative user not found");
      }

      const company = await this.companyRepo.findById(dto.companyId, false, tx);
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      const customer = await this.userRepo.findById(dto.customerId, tx);
      if (!customer) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
      }

      // Verify deal exists
      const deal = await tx.deal.findFirst({
        where: {
          id: dto.dealId,
          companyId: dto.companyId,
        },
      });
      if (!deal) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Deal not found or does not belong to the specified company",
        );
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
      const { itemsToCreate, subtotal, totalDiscount, taxAmount, total } =
        this.calculateQuotationTotals(dto.items, productMap, dto.discountAmount);

      const count = await this.quotationRepo.countCompanyQuotations(
        dto.companyId,
        tx,
      );

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const seq = String(count + 1).padStart(4, "0");
      const quotationNo = `QT-${year}${month}-${seq}`;

      const validUntil = dto.validUntil
        ? new Date(dto.validUntil)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const initialStatus = dto.status || QuotationStatus.DRAFT;

      const quotation = await this.quotationRepo.create(
        {
          companyId: dto.companyId,
          dealId: dto.dealId,
          salesRepId: salesRepUserId,
          customerId: dto.customerId,
          quotationNo,
          status: initialStatus,
          validUntil,
          currency: dto.currency || company.currency || "USD",
        },
        itemsToCreate,
        {
          subtotal,
          discountAmount: totalDiscount,
          taxAmount,
          totalAmount: total,
          customerNote: dto.customerNote || null,
          internalNote: dto.internalNote || null,
        },
        tx,
      );

      if (initialStatus === QuotationStatus.SENT) {
        if (
          deal.stage === DealStage.NEW ||
          deal.stage === DealStage.QUALIFICATION ||
          deal.stage === DealStage.REQUIREMENT
        ) {
          await tx.deal.update({
            where: { id: deal.id },
            data: { stage: DealStage.QUOTATION },
          });
        }
      }

      return toQuotationDto(quotation);
    });
  }

  public async sendQuotation(
    quotationId: string,
    requestingUserId: string,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      await this.assertQuotationManageAccess(quotation, requestingUserId);

      if (quotation.status === QuotationStatus.SENT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Quotation has already been sent",
        );
      }

      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot send a quotation in status ${quotation.status}`,
        );
      }

      if (quotation.currentRevisionId) {
        await tx.quotationRevision.update({
          where: { id: quotation.currentRevisionId },
          data: { status: RevisionStatus.SENT },
        });
      }

      const deal = await tx.deal.findUnique({
        where: { id: quotation.dealId },
      });

      if (
        deal &&
        (deal.stage === DealStage.NEW ||
          deal.stage === DealStage.QUALIFICATION ||
          deal.stage === DealStage.REQUIREMENT)
      ) {
        await tx.deal.update({
          where: { id: deal.id },
          data: { stage: DealStage.QUOTATION },
        });
      }

      const updated = await this.quotationRepo.update(
        quotationId,
        { status: QuotationStatus.SENT },
        tx,
      );

      return toQuotationDto(updated);
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

  public async getQuotationRevisions(
    quotationId: string,
    requestingUserId: string,
  ): Promise<QuotationRevisionResponseDto[]> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    await this.assertQuotationAccess(quotation, requestingUserId);

    const revisions = await this.quotationRepo.findRevisions(quotationId);
    return revisions.map(toQuotationRevisionDto);
  }

  public async listQuotations(
    requestingUserId: string,
    filters: QuotationFilterDto,
  ): Promise<{
    quotations: QuotationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
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
        where.companyId = filters.companyId;
        where.customerId = requestingUserId;
      } else {
        where.companyId = filters.companyId;
      }
    } else {
      const memberships = await this.companyRepo.findUserCompanies(
        requestingUserId,
      );
      const companyIds = memberships.map((m) => m.company.id);

      where.OR = [
        { salesRepId: requestingUserId },
        { customerId: requestingUserId },
        { companyId: { in: companyIds } },
      ];
    }

    if (filters.dealId) {
      where.dealId = filters.dealId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.salesRepId) {
      where.salesRepId = filters.salesRepId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { quotationNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const { quotations, total } = await this.quotationRepo.findMany(
      where,
      page,
      limit,
    );

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

      await this.assertQuotationManageAccess(quotation, requestingUserId);

      if (
        quotation.status !== QuotationStatus.DRAFT &&
        quotation.status !== QuotationStatus.NEGOTIATING
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

      const targetStatus = dto.status || quotation.status;

      let itemsToCreate;
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

        await this.quotationRepo.deleteItemsByQuotationId(quotationId, tx);

        // Create new versioned revision
        const revision = await this.quotationRepo.createRevision(
          quotationId,
          requestingUserId,
          RevisionType.SALES_COUNTER,
          targetStatus === QuotationStatus.SENT
            ? RevisionStatus.SENT
            : RevisionStatus.DRAFT,
          {
            subtotal: calculated.subtotal,
            discountAmount: calculated.totalDiscount,
            taxAmount: calculated.taxAmount,
            totalAmount: calculated.total,
            customerNote: dto.customerNote || null,
            internalNote: dto.internalNote || null,
          },
          itemsToCreate,
          tx,
        );

        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            currentRevisionId: revision.id,
            items: {
              create: itemsToCreate.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountType: item.discountType,
                discountValue: item.discountValue,
                discountAmount: item.discountAmount,
                taxRate: item.taxRate,
                finalUnitPrice: item.finalUnitPrice,
                lineTotal: item.lineTotal,
              })),
            },
          },
        });
      }

      if (dto.status === QuotationStatus.SENT) {
        if (quotation.currentRevisionId) {
          await tx.quotationRevision.update({
            where: { id: quotation.currentRevisionId },
            data: { status: RevisionStatus.SENT },
          });
        }

        const deal = await tx.deal.findUnique({
          where: { id: quotation.dealId },
        });

        if (
          deal &&
          (deal.stage === DealStage.NEW ||
            deal.stage === DealStage.QUALIFICATION ||
            deal.stage === DealStage.REQUIREMENT)
        ) {
          await tx.deal.update({
            where: { id: deal.id },
            data: { stage: DealStage.QUOTATION },
          });
        }
      }

      const updateData: Prisma.QuotationUpdateInput = {
        ...(dto.customerId
          ? { customer: { connect: { id: dto.customerId } } }
          : {}),
        ...(dto.validUntil !== undefined
          ? {
              validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
            }
          : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      };

      const updated = await this.quotationRepo.update(
        quotationId,
        updateData,
        tx,
      );
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

      if (quotation.customerId === requestingUserId) {
        if (
          status !== QuotationStatus.ACCEPTED &&
          status !== QuotationStatus.REJECTED &&
          status !== QuotationStatus.NEGOTIATING
        ) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Customer can only ACCEPT, REJECT, or mark quotation NEGOTIATING",
          );
        }
      } else {
        await this.assertQuotationManageAccess(quotation, requestingUserId);
      }

      if (status === QuotationStatus.SENT) {
        if (quotation.currentRevisionId) {
          await tx.quotationRevision.update({
            where: { id: quotation.currentRevisionId },
            data: { status: RevisionStatus.SENT },
          });
        }

        const deal = await tx.deal.findUnique({
          where: { id: quotation.dealId },
        });

        if (
          deal &&
          (deal.stage === DealStage.NEW ||
            deal.stage === DealStage.QUALIFICATION ||
            deal.stage === DealStage.REQUIREMENT)
        ) {
          await tx.deal.update({
            where: { id: deal.id },
            data: { stage: DealStage.QUOTATION },
          });
        }
      } else if (status === QuotationStatus.ACCEPTED) {
        if (quotation.currentRevisionId) {
          await tx.quotationRevision.update({
            where: { id: quotation.currentRevisionId },
            data: { status: RevisionStatus.ACCEPTED },
          });
        }
      } else if (status === QuotationStatus.REJECTED) {
        if (quotation.currentRevisionId) {
          await tx.quotationRevision.update({
            where: { id: quotation.currentRevisionId },
            data: { status: RevisionStatus.REJECTED },
          });
        }
      } else if (status === QuotationStatus.NEGOTIATING) {
        const deal = await tx.deal.findUnique({
          where: { id: quotation.dealId },
        });

        if (deal && deal.stage === DealStage.QUOTATION) {
          await tx.deal.update({
            where: { id: deal.id },
            data: { stage: DealStage.NEGOTIATION },
          });
        }
      }

      const updated = await this.quotationRepo.updateStatus(
        quotationId,
        status,
        tx,
      );
      return toQuotationDto(updated);
    });
  }

  public async cancelQuotation(
    quotationId: string,
    requestingUserId: string,
    _dto?: CancelQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      await this.assertQuotationManageAccess(quotation, requestingUserId);

      if (quotation.status === QuotationStatus.CANCELLED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Quotation is already cancelled",
        );
      }

      if (quotation.status === QuotationStatus.ACCEPTED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot cancel an accepted quotation",
        );
      }

      if (quotation.status === QuotationStatus.EXPIRED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot cancel an expired quotation",
        );
      }

      const updated = await this.quotationRepo.update(
        quotationId,
        {
          status: QuotationStatus.CANCELLED,
        },
        tx,
      );

      return toQuotationDto(updated);
    });
  }

  public async rejectQuotation(
    quotationId: string,
    requestingUserId: string,
    _dto?: RejectQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      await this.assertQuotationAccess(quotation, requestingUserId);

      if (quotation.status === QuotationStatus.REJECTED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Quotation is already rejected",
        );
      }

      if (quotation.status === QuotationStatus.ACCEPTED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot reject an accepted quotation",
        );
      }

      if (quotation.status === QuotationStatus.CANCELLED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot reject a cancelled quotation",
        );
      }

      if (quotation.status === QuotationStatus.EXPIRED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot reject an expired quotation",
        );
      }

      if (quotation.currentRevisionId) {
        await tx.quotationRevision.update({
          where: { id: quotation.currentRevisionId },
          data: { status: RevisionStatus.REJECTED },
        });
      }

      const updated = await this.quotationRepo.update(
        quotationId,
        {
          status: QuotationStatus.REJECTED,
        },
        tx,
      );

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
      discountType: DiscountType;
      discountValue: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      finalUnitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }>;
    subtotal: Prisma.Decimal;
    totalDiscount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    total: Prisma.Decimal;
  } {
    let subtotalNum = 0;
    let itemDiscountSum = 0;
    let taxAmountSum = 0;
    let totalNum = 0;

    const itemsToCreate = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPriceNum =
        item.unitPrice !== undefined
          ? Number(item.unitPrice)
          : Number(product.price);
      const quantityNum = Number(item.quantity);
      const discountType = item.discountType || DiscountType.PERCENTAGE;
      const discountVal = Number(item.discountValue || 0);
      const taxRateNum = Number(item.taxRate || 0);

      const grossLine = quantityNum * unitPriceNum;
      const discountAmt =
        discountType === DiscountType.PERCENTAGE
          ? grossLine * (discountVal / 100)
          : Math.min(grossLine, discountVal);

      const finalUnit = Math.max(
        0,
        unitPriceNum - (quantityNum > 0 ? discountAmt / quantityNum : 0),
      );
      const lineTaxable = Math.max(0, grossLine - discountAmt);
      const lineTax = lineTaxable * (taxRateNum / 100);
      const lineTotalNum = lineTaxable + lineTax;

      subtotalNum += grossLine;
      itemDiscountSum += discountAmt;
      taxAmountSum += lineTax;
      totalNum += lineTotalNum;

      return {
        productId: item.productId,
        quantity: new Prisma.Decimal(quantityNum.toFixed(2)),
        unitPrice: new Prisma.Decimal(unitPriceNum.toFixed(2)),
        discountType,
        discountValue: new Prisma.Decimal(discountVal.toFixed(2)),
        discountAmount: new Prisma.Decimal(discountAmt.toFixed(2)),
        taxRate: new Prisma.Decimal(taxRateNum.toFixed(2)),
        finalUnitPrice: new Prisma.Decimal(finalUnit.toFixed(2)),
        lineTotal: new Prisma.Decimal(lineTotalNum.toFixed(2)),
      };
    });

    const finalTotalDiscountNum =
      itemDiscountSum + (extraDiscountAmount || 0);
    const finalTotalNum = Math.max(0, totalNum - (extraDiscountAmount || 0));

    return {
      itemsToCreate,
      subtotal: new Prisma.Decimal(subtotalNum.toFixed(2)),
      totalDiscount: new Prisma.Decimal(finalTotalDiscountNum.toFixed(2)),
      taxAmount: new Prisma.Decimal(taxAmountSum.toFixed(2)),
      total: new Prisma.Decimal(finalTotalNum.toFixed(2)),
    };
  }

  private async assertQuotationAccess(
    quotation: {
      companyId: string;
      salesRepId: string;
      customerId: string;
      company: { ownerId: string };
    },
    userId: string,
  ): Promise<void> {
    if (quotation.salesRepId === userId || quotation.customerId === userId) {
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

  private async assertQuotationManageAccess(
    quotation: {
      companyId: string;
      salesRepId: string;
      company: { ownerId: string };
    },
    userId: string,
  ): Promise<CompanyUserRole> {
    if (quotation.company.ownerId === userId) {
      return CompanyUserRole.ADMIN;
    }

    const membership = await this.companyRepo.findCompanyUser(
      quotation.companyId,
      userId,
    );

    if (!membership) {
      if (quotation.salesRepId === userId) {
        return CompanyUserRole.SALES_REP;
      }
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to manage this quotation",
      );
    }

    const allowedRoles: CompanyUserRole[] = [
      CompanyUserRole.ADMIN,
      CompanyUserRole.SALES_REP,
      CompanyUserRole.SALES_MANAGER,
    ];

    if (!allowedRoles.includes(membership.role)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to manage this quotation",
      );
    }

    return membership.role;
  }
}

export const quotationService = new QuotationService();
