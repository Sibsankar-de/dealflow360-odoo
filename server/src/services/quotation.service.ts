import {
  Prisma,
  QuotationStatus,
  DiscountType,
  RevisionType,
  RevisionStatus,
  DealStage,
  NegotiationStatus,
  OfferParty,
  OfferStatus,
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
import {
  DealRepository,
  dealRepository as defaultDealRepository,
} from "../repositories/deal.repository";
import { ApiError } from "../utils/apiErrorHandler";
import {
  prismaTransaction,
  TransactionClient,
} from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CreateQuotationDto,
  CreateQuotationItemDto,
  UpdateQuotationDto,
  AddQuotationItemDto,
  QuotationResponseDto,
  QuotationItemResponseDto,
  QuotationRevisionResponseDto,
  QuotationFilterDto,
  DealQuotationsQueryDto,
  RejectQuotationDto,
  SubmitCounterOfferDto,
  NegotiationResponseDto,
  toQuotationDto,
  toQuotationItemDto,
  toQuotationRevisionDto,
  toNegotiationDto,
} from "../dto/quotation.dto";
import { customerDiscountTierConverter } from "../converters/companySetting.converter";
import {
  calculateDiscountViolations,
  DiscountLineItemInput,
  DiscountViolationEvaluation,
} from "../utils/discount-violation.util";

export class QuotationService {
  private quotationRepo: QuotationRepository;
  private companyRepo: CompanyRepository;
  private userRepo: UserRepository;
  private dealRepo: DealRepository;

  public constructor(
    quotationRepo: QuotationRepository = defaultQuotationRepository,
    companyRepo: CompanyRepository = defaultCompanyRepository,
    userRepo: UserRepository = defaultUserRepository,
    dealRepo: DealRepository = defaultDealRepository,
  ) {
    this.quotationRepo = quotationRepo;
    this.companyRepo = companyRepo;
    this.userRepo = userRepo;
    this.dealRepo = dealRepo;
  }

  public async createQuotation(
    salesRepUserId: string,
    dto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const dealId = dto.dealId;
      if (!dealId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Deal ID is required");
      }

      const customerId = dto.customerId;
      if (!customerId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Customer ID is required");
      }

      const salesRepId = dto.salesRepId || salesRepUserId;
      const salesRep = await this.userRepo.findById(salesRepId, tx);
      if (!salesRep) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Sales representative user not found",
        );
      }

      const customer = await this.userRepo.findById(customerId, tx);
      if (!customer) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
      }

      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });
      if (!deal) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Deal not found");
      }

      const companyId = dto.companyId || deal.companyId;
      if (deal.companyId !== companyId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Deal does not belong to the specified company",
        );
      }

      const company = await this.companyRepo.findById(companyId, false, tx);
      if (!company) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
      }

      const now = new Date();
      const quotationNo = await this.generateQuotationNo(tx);

      const validUntilRaw = dto.validUntil;
      const validUntil = validUntilRaw
        ? new Date(validUntilRaw)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const currency = dto.currency || company.currency || "USD";

      const quotation = await this.quotationRepo.createDraft(
        {
          companyId,
          dealId,
          salesRepId,
          customerId,
          quotationNo,
          validUntil,
          currency,
        },
        tx,
      );

      return toQuotationDto(quotation);
    });
  }

  public async addQuotationItem(
    quotationId: string,
    dto: AddQuotationItemDto,
  ): Promise<QuotationItemResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot add items to a quotation that is not in DRAFT status",
        );
      }

      const productId = dto.productId;
      if (!productId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID is required");
      }

      const product = await this.quotationRepo.findProductById(
        productId,
        quotation.companyId,
        tx,
      );
      if (!product) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Product not found or does not belong to the company",
        );
      }

      const quantity = Number(dto.quantity);
      if (!quantity || quantity <= 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Quantity must be greater than 0",
        );
      }

      // Customer tier discount lookup
      const companyUser = await this.companyRepo.findCompanyUser(
        quotation.companyId,
        quotation.customerId,
        tx,
      );

      let discountPercent = 0;
      if (companyUser?.customerTier) {
        const productTier = await this.quotationRepo.findProductDiscountTier(
          productId,
          companyUser.customerTier,
          tx,
        );

        if (productTier) {
          discountPercent = Number(productTier.discountPercent);
        } else {
          const settings = await this.companyRepo.findSettings(
            quotation.companyId,
            tx,
          );
          if (settings?.customerDiscountTier) {
            const tierMap = customerDiscountTierConverter(
              settings.customerDiscountTier,
            );
            if (tierMap[companyUser.customerTier] !== undefined) {
              discountPercent = tierMap[companyUser.customerTier] ?? 0;
            }
          }
        }
      }

      const unitPriceNum = Number(product.price);
      const grossLine = unitPriceNum * quantity;
      const discountAmt = grossLine * (discountPercent / 100);
      const finalUnitPriceNum = Math.max(
        0,
        unitPriceNum - (discountAmt / quantity),
      );
      const lineTotalNum = Math.max(0, grossLine - discountAmt);

      const item = await this.quotationRepo.addItem(
        {
          quotationId,
          productId,
          quantity: new Prisma.Decimal(quantity.toFixed(2)),
          unitPrice: new Prisma.Decimal(unitPriceNum.toFixed(2)),
          discountType: DiscountType.PERCENTAGE,
          discountValue: new Prisma.Decimal(discountPercent.toFixed(2)),
          discountAmount: new Prisma.Decimal(discountAmt.toFixed(2)),
          taxRate: new Prisma.Decimal("0.00"),
          finalUnitPrice: new Prisma.Decimal(finalUnitPriceNum.toFixed(2)),
          lineTotal: new Prisma.Decimal(lineTotalNum.toFixed(2)),
        },
        tx,
      );

      return toQuotationItemDto(item);
    });
  }

  public async removeQuotationItem(
    quotationId: string,
    itemId: string,
  ): Promise<{ success: boolean; message: string }> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot remove items from a quotation that is not in DRAFT status",
        );
      }

      const item = await this.quotationRepo.findItemById(
        quotationId,
        itemId,
        tx,
      );
      if (!item) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "Quotation item not found",
        );
      }

      await this.quotationRepo.removeItem(quotationId, itemId, tx);

      return {
        success: true,
        message: "Quotation item removed successfully",
      };
    });
  }

  public async getQuotationItems(
    quotationId: string,
  ): Promise<QuotationItemResponseDto[]> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    const items = await this.quotationRepo.findItemsByQuotationId(quotationId);
    return items.map(toQuotationItemDto);
  }

  public async sendQuotation(
    quotationId: string,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

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

      if (!quotation.items || quotation.items.length === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot send a quotation with no items. Please add at least one item.",
        );
      }

      if (
        quotation.validUntil &&
        new Date(quotation.validUntil).getTime() < Date.now()
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot send an expired quotation. Please update valid until date.",
        );
      }

      const discountEvaluation = await this.evaluateDiscountViolations(
        quotationId,
        tx,
      );
      const evalNote = `Discount Evaluation: maxLineViolation=${discountEvaluation.maxLineViolation}%, blendedViolationScore=${discountEvaluation.blendedViolationScore}%, requiresApproval=${discountEvaluation.requiresApproval}`;

      if (quotation.currentRevisionId) {
        await tx.quotationRevision.update({
          where: { id: quotation.currentRevisionId },
          data: {
            status: RevisionStatus.SENT,
            internalNote: quotation.currentRevision?.internalNote
              ? `${quotation.currentRevision.internalNote} | ${evalNote}`
              : evalNote,
          },
        });
      } else {
        let subtotal = new Prisma.Decimal(0);
        let discountTotal = new Prisma.Decimal(0);
        let taxTotal = new Prisma.Decimal(0);
        let totalAmount = new Prisma.Decimal(0);

        const revisionItems = (quotation.items || []).map((item) => {
          subtotal = subtotal.add(item.unitPrice.mul(item.quantity));
          discountTotal = discountTotal.add(item.discountAmount);
          taxTotal = taxTotal.add(
            item.lineTotal.sub(
              item.unitPrice.mul(item.quantity).sub(item.discountAmount),
            ),
          );
          totalAmount = totalAmount.add(item.lineTotal);

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            finalUnitPrice: item.finalUnitPrice,
            lineTotal: item.lineTotal,
          };
        });

        const revision = await tx.quotationRevision.create({
          data: {
            quotationId: quotation.id,
            revisionNo: 1,
            createdById: quotation.salesRepId,
            revisionType: RevisionType.INITIAL,
            status: RevisionStatus.SENT,
            subtotal,
            discountAmount: discountTotal,
            taxAmount: taxTotal,
            totalAmount,
            internalNote: evalNote,
            items: {
              create: revisionItems,
            },
          },
        });

        await tx.quotation.update({
          where: { id: quotation.id },
          data: { currentRevisionId: revision.id },
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

      const updated = await this.quotationRepo.updateStatus(
        quotationId,
        QuotationStatus.SENT,
        tx,
      );

      const dto = toQuotationDto(updated);
      dto.discountEvaluation = discountEvaluation;
      return dto;
    });
  }

  public async evaluateDiscountViolations(
    quotationId: string,
    tx?: TransactionClient,
  ): Promise<DiscountViolationEvaluation> {
    const quotation = await this.quotationRepo.findById(quotationId, tx);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    const companyUser = await this.companyRepo.findCompanyUser(
      quotation.companyId,
      quotation.customerId,
      tx,
    );
    const customerTier = companyUser?.customerTier ?? null;

    let defaultTierMap: Record<string, number> = {};
    const settings = await this.companyRepo.findSettings(
      quotation.companyId,
      tx,
    );
    if (settings?.customerDiscountTier) {
      defaultTierMap = customerDiscountTierConverter(
        settings.customerDiscountTier,
      );
    }

    const config = await this.companyRepo.findConfig(
      quotation.companyId,
      "BLENDED_DISCOUNT_THRESHOLD",
      tx,
    );
    const blendedThreshold =
      config?.configValue && !isNaN(Number(config.configValue))
        ? Number(config.configValue)
        : 0;

    const discountInputs: DiscountLineItemInput[] = [];

    for (const item of quotation.items || []) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const preDiscountValue = quantity * unitPrice;

      let actualDiscountPercentage = 0;
      if (item.discountType === DiscountType.PERCENTAGE) {
        actualDiscountPercentage = Number(item.discountValue);
      } else {
        const discountAmt = Number(item.discountAmount);
        actualDiscountPercentage =
          preDiscountValue > 0 ? (discountAmt / preDiscountValue) * 100 : 0;
      }

      let allowedDiscountPercentage = 0;
      if (customerTier) {
        const productTier = await this.quotationRepo.findProductDiscountTier(
          item.productId,
          customerTier,
          tx,
        );
        if (productTier) {
          allowedDiscountPercentage = Number(productTier.discountPercent);
        } else if (defaultTierMap[customerTier] !== undefined) {
          allowedDiscountPercentage = defaultTierMap[customerTier];
        }
      }

      discountInputs.push({
        productId: item.productId,
        actualDiscountPercentage,
        allowedDiscountPercentage,
        preDiscountValue,
      });
    }

    return calculateDiscountViolations(discountInputs, blendedThreshold);
  }

  public async getQuotationById(
    quotationId: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    const dto = toQuotationDto(quotation);
    if (quotation.items && quotation.items.length > 0) {
      dto.discountEvaluation = await this.evaluateDiscountViolations(quotationId);
    }
    return dto;
  }

  public async getQuotationNegotiations(
    quotationId: string,
  ): Promise<NegotiationResponseDto[]> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    const negotiations =
      await this.quotationRepo.findNegotiationsByQuotationId(quotationId);
    return negotiations.map(toNegotiationDto);
  }

  public async getQuotationRevisions(
    quotationId: string,
  ): Promise<QuotationRevisionResponseDto[]> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
    }

    const revisions = await this.quotationRepo.findRevisions(quotationId);
    return revisions.map(toQuotationRevisionDto);
  }

  public async listQuotations(
    requestingUserId: string,
    filters: QuotationFilterDto,
  ): Promise<PaginatedResult<QuotationResponseDto>> {
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

    const result = await this.quotationRepo.findMany(where, { page, limit });

    return {
      ...result,
      docs: result.docs.map(toQuotationDto),
    };
  }

  public async listQuotationsByDeal(
    dealId: string,
    filters: DealQuotationsQueryDto = {},
    companyId?: string,
  ): Promise<PaginatedResult<QuotationResponseDto>> {
    const deal = await this.dealRepo.findById(dealId);
    if (!deal) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Deal not found");
    }

    if (companyId && deal.companyId !== companyId) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Deal does not belong to the specified company",
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: Prisma.QuotationWhereInput = {
      dealId,
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.quotationNo = {
        contains: filters.search,
        mode: Prisma.QueryMode.insensitive,
      };
    }

    const result = await this.quotationRepo.findMany(where, { page, limit });

    return {
      ...result,
      docs: result.docs.map(toQuotationDto),
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

  // Customer-initiated status transitions: ACCEPTED, REJECTED, NEGOTIATING.
  // Company-member status transitions are handled by dedicated endpoints (send, cancel).
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

      if (quotation.customerId !== requestingUserId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Only the customer can update quotation status via this endpoint",
        );
      }

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

      if (status === QuotationStatus.ACCEPTED) {
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
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

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
    requestingUserId?: string,
    dto?: RejectQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (requestingUserId) {
        const isAssignedCustomer = quotation.customerId === requestingUserId;
        const membership = await this.companyRepo.findCompanyUser(
          quotation.companyId,
          requestingUserId,
          tx,
        );

        const isStaff =
          membership &&
          (membership.role === CompanyUserRole.ADMIN ||
            membership.role === CompanyUserRole.SALES_MANAGER);

        if (!isAssignedCustomer && !isStaff) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "Only the customer assigned to this quotation can reject it",
          );
        }

        if (
          isAssignedCustomer &&
          (!membership || membership.role !== CompanyUserRole.CUSTOMER)
        ) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "User does not have the CUSTOMER role in this company",
          );
        }
      }

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

      if (quotation.status === QuotationStatus.DRAFT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot reject a draft quotation. The quotation must be sent to the customer first",
        );
      }

      await tx.negotiation.updateMany({
        where: { quotationId, status: NegotiationStatus.OPEN },
        data: {
          status: NegotiationStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      await tx.negotiationOffer.updateMany({
        where: {
          negotiation: { quotationId },
          status: OfferStatus.PENDING,
        },
        data: {
          status: OfferStatus.REJECTED,
        },
      });

      if (quotation.currentRevisionId) {
        await tx.quotationRevision.update({
          where: { id: quotation.currentRevisionId },
          data: {
            status: RevisionStatus.REJECTED,
            ...(dto?.reason ? { customerNote: dto.reason } : {}),
          },
        });
      } else {
        const lastRev = await tx.quotationRevision.findFirst({
          where: { quotationId },
          orderBy: { revisionNo: "desc" },
        });
        const nextRevNo = (lastRev?.revisionNo || 0) + 1;

        let subtotal = new Prisma.Decimal(0);
        let discountTotal = new Prisma.Decimal(0);
        let taxTotal = new Prisma.Decimal(0);
        let totalAmount = new Prisma.Decimal(0);

        const revisionItems = (quotation.items || []).map((item) => {
          subtotal = subtotal.add(item.unitPrice.mul(item.quantity));
          discountTotal = discountTotal.add(item.discountAmount);
          taxTotal = taxTotal.add(
            item.lineTotal.sub(
              item.unitPrice.mul(item.quantity).sub(item.discountAmount),
            ),
          );
          totalAmount = totalAmount.add(item.lineTotal);

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            finalUnitPrice: item.finalUnitPrice,
            lineTotal: item.lineTotal,
          };
        });

        const revision = await tx.quotationRevision.create({
          data: {
            quotationId,
            revisionNo: nextRevNo,
            createdById: requestingUserId || quotation.salesRepId,
            revisionType: RevisionType.INITIAL,
            status: RevisionStatus.REJECTED,
            subtotal,
            discountAmount: discountTotal,
            taxAmount: taxTotal,
            totalAmount,
            customerNote: dto?.reason || null,
            items: {
              create: revisionItems,
            },
          },
        });

        await tx.quotation.update({
          where: { id: quotationId },
          data: { currentRevisionId: revision.id },
        });
      }

      await this.quotationRepo.update(
        quotationId,
        {
          status: QuotationStatus.REJECTED,
        },
        tx,
      );

      const refreshed = await this.quotationRepo.findById(quotationId, tx);
      return toQuotationDto(refreshed!);
    });
  }

  public async submitCounterOffer(
    quotationId: string,
    requestingUserId: string,
    dto: SubmitCounterOfferDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (quotation.customerId !== requestingUserId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Only the customer assigned to this quotation can negotiate",
        );
      }

      const membership = await this.companyRepo.findCompanyUser(
        quotation.companyId,
        requestingUserId,
        tx,
      );

      if (!membership || membership.role !== CompanyUserRole.CUSTOMER) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "User does not have the CUSTOMER role in this company",
        );
      }

      if (quotation.status === QuotationStatus.DRAFT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot negotiate a draft quotation. The quotation must be sent to the customer first",
        );
      }

      if (quotation.status === QuotationStatus.ACCEPTED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot negotiate an accepted quotation",
        );
      }

      if (quotation.status === QuotationStatus.REJECTED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot negotiate a rejected quotation",
        );
      }

      if (quotation.status === QuotationStatus.CANCELLED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot negotiate a cancelled quotation",
        );
      }

      if (quotation.status === QuotationStatus.EXPIRED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot negotiate an expired quotation",
        );
      }

      const baseItems = quotation.items || [];
      const itemMap = new Map(baseItems.map((item) => [item.id, item]));
      const productMap = new Map(
        baseItems.map((item) => [item.productId, item]),
      );

      let calculatedSubtotal = new Prisma.Decimal(0);
      let calculatedTotalDiscount = new Prisma.Decimal(0);
      let calculatedTax = new Prisma.Decimal(0);
      let calculatedTotal = new Prisma.Decimal(0);

      const offerItemsData: Array<{
        quotationItemId?: string | null;
        productId: string;
        requestedQuantity: Prisma.Decimal;
        requestedUnitPrice: Prisma.Decimal;
        requestedDiscountType: DiscountType;
        requestedDiscountValue: Prisma.Decimal;
        requestedLineTotal: Prisma.Decimal;
      }> = [];

      const revisionItemsData: Array<{
        productId: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        discountType: DiscountType;
        discountValue: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        finalUnitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }> = [];

      if (dto.items && dto.items.length > 0) {
        for (const itemDto of dto.items) {
          const existing =
            (itemDto.quotationItemId && itemMap.get(itemDto.quotationItemId)) ||
            (itemDto.productId && productMap.get(itemDto.productId));

          if (!existing) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              "Proposed item does not match any existing item in quotation",
            );
          }

          const quantity = new Prisma.Decimal(
            itemDto.requestedQuantity ?? existing.quantity,
          );
          const unitPrice = new Prisma.Decimal(
            itemDto.requestedUnitPrice ?? existing.unitPrice,
          );
          const discountType =
            itemDto.requestedDiscountType ??
            existing.discountType ??
            DiscountType.PERCENTAGE;
          const discountValue = new Prisma.Decimal(
            itemDto.requestedDiscountValue ?? existing.discountValue ?? 0,
          );
          const taxRate = new Prisma.Decimal(existing.taxRate);

          let discountAmount = new Prisma.Decimal(0);
          if (discountType === DiscountType.PERCENTAGE) {
            discountAmount = unitPrice
              .mul(quantity)
              .mul(discountValue)
              .div(100);
          } else {
            discountAmount = discountValue;
          }

          const lineBase = unitPrice.mul(quantity).sub(discountAmount);
          const finalUnitPrice = lineBase.div(quantity);
          const lineTax = lineBase.mul(taxRate).div(100);
          const lineTotal = lineBase.add(lineTax);

          calculatedSubtotal = calculatedSubtotal.add(unitPrice.mul(quantity));
          calculatedTotalDiscount = calculatedTotalDiscount.add(discountAmount);
          calculatedTax = calculatedTax.add(lineTax);
          calculatedTotal = calculatedTotal.add(lineTotal);

          offerItemsData.push({
            quotationItemId: existing.id,
            productId: existing.productId,
            requestedQuantity: quantity,
            requestedUnitPrice: unitPrice,
            requestedDiscountType: discountType,
            requestedDiscountValue: discountValue,
            requestedLineTotal: lineTotal,
          });

          revisionItemsData.push({
            productId: existing.productId,
            quantity,
            unitPrice,
            discountType,
            discountValue,
            discountAmount,
            taxRate,
            finalUnitPrice,
            lineTotal,
          });
        }
      } else {
        for (const existing of baseItems) {
          const quantity = new Prisma.Decimal(existing.quantity);
          const unitPrice = new Prisma.Decimal(existing.unitPrice);
          let discountType = existing.discountType;
          let discountValue = new Prisma.Decimal(existing.discountValue);
          const taxRate = new Prisma.Decimal(existing.taxRate);

          if (dto.proposedDiscount !== undefined) {
            discountType = dto.discountType ?? DiscountType.PERCENTAGE;
            discountValue = new Prisma.Decimal(dto.proposedDiscount);
          } else if (dto.proposedPrice !== undefined) {
            const currentSubtotal = baseItems.reduce(
              (sum, it) => sum + Number(it.unitPrice) * Number(it.quantity),
              0,
            );
            if (currentSubtotal > 0 && dto.proposedPrice < currentSubtotal) {
              discountType = DiscountType.PERCENTAGE;
              const discPercent =
                ((currentSubtotal - dto.proposedPrice) / currentSubtotal) * 100;
              discountValue = new Prisma.Decimal(discPercent.toFixed(2));
            }
          }

          let discountAmount = new Prisma.Decimal(0);
          if (discountType === DiscountType.PERCENTAGE) {
            discountAmount = unitPrice
              .mul(quantity)
              .mul(discountValue)
              .div(100);
          } else {
            discountAmount = discountValue;
          }

          const lineBase = unitPrice.mul(quantity).sub(discountAmount);
          const finalUnitPrice = lineBase.div(quantity);
          const lineTax = lineBase.mul(taxRate).div(100);
          const lineTotal = lineBase.add(lineTax);

          calculatedSubtotal = calculatedSubtotal.add(unitPrice.mul(quantity));
          calculatedTotalDiscount = calculatedTotalDiscount.add(discountAmount);
          calculatedTax = calculatedTax.add(lineTax);
          calculatedTotal = calculatedTotal.add(lineTotal);

          offerItemsData.push({
            quotationItemId: existing.id,
            productId: existing.productId,
            requestedQuantity: quantity,
            requestedUnitPrice: unitPrice,
            requestedDiscountType: discountType,
            requestedDiscountValue: discountValue,
            requestedLineTotal: lineTotal,
          });

          revisionItemsData.push({
            productId: existing.productId,
            quantity,
            unitPrice,
            discountType,
            discountValue,
            discountAmount,
            taxRate,
            finalUnitPrice,
            lineTotal,
          });
        }
      }

      let negotiation = await tx.negotiation.findFirst({
        where: { quotationId, status: NegotiationStatus.OPEN },
      });
      if (!negotiation) {
        negotiation = await tx.negotiation.create({
          data: {
            quotationId,
            status: NegotiationStatus.OPEN,
          },
        });
      }

      await tx.negotiationOffer.updateMany({
        where: {
          negotiationId: negotiation.id,
          status: OfferStatus.PENDING,
        },
        data: {
          status: OfferStatus.SUPERSEDED,
        },
      });

      await tx.negotiationOffer.create({
        data: {
          negotiationId: negotiation.id,
          baseRevisionId: quotation.currentRevisionId,
          offeredBy: OfferParty.CUSTOMER,
          status: OfferStatus.PENDING,
          message: dto.message || null,
          items: {
            create: offerItemsData,
          },
        },
      });

      const customerTier = membership.customerTier ?? null;

      let defaultTierMap: Record<string, number> = {};
      const settings = await this.companyRepo.findSettings(
        quotation.companyId,
        tx,
      );
      if (settings?.customerDiscountTier) {
        defaultTierMap = customerDiscountTierConverter(
          settings.customerDiscountTier,
        );
      }

      const config = await this.companyRepo.findConfig(
        quotation.companyId,
        "BLENDED_DISCOUNT_THRESHOLD",
        tx,
      );
      const blendedThreshold =
        config?.configValue && !isNaN(Number(config.configValue))
          ? Number(config.configValue)
          : 0;

      const counterDiscountInputs: DiscountLineItemInput[] = [];
      for (const revItem of revisionItemsData) {
        const qty = Number(revItem.quantity);
        const unitP = Number(revItem.unitPrice);
        const preDiscountVal = qty * unitP;

        let actualDisc = 0;
        if (revItem.discountType === DiscountType.PERCENTAGE) {
          actualDisc = Number(revItem.discountValue);
        } else {
          const discAmt = Number(revItem.discountAmount);
          actualDisc =
            preDiscountVal > 0 ? (discAmt / preDiscountVal) * 100 : 0;
        }

        let allowedDisc = 0;
        if (customerTier) {
          const productTier = await this.quotationRepo.findProductDiscountTier(
            revItem.productId,
            customerTier,
            tx,
          );
          if (productTier) {
            allowedDisc = Number(productTier.discountPercent);
          } else if (defaultTierMap[customerTier] !== undefined) {
            allowedDisc = defaultTierMap[customerTier];
          }
        }

        counterDiscountInputs.push({
          productId: revItem.productId,
          actualDiscountPercentage: actualDisc,
          allowedDiscountPercentage: allowedDisc,
          preDiscountValue: preDiscountVal,
        });
      }

      const counterDiscountEvaluation = calculateDiscountViolations(
        counterDiscountInputs,
        blendedThreshold,
      );
      const counterEvalNote = `Counter-Offer Discount Evaluation: maxLineViolation=${counterDiscountEvaluation.maxLineViolation}%, blendedViolationScore=${counterDiscountEvaluation.blendedViolationScore}%, requiresApproval=${counterDiscountEvaluation.requiresApproval}`;

      const revisionCount = await tx.quotationRevision.count({
        where: { quotationId },
      });

      const revision = await tx.quotationRevision.create({
        data: {
          quotationId,
          revisionNo: revisionCount + 1,
          createdById: requestingUserId,
          revisionType: RevisionType.CUSTOMER_COUNTER,
          status: RevisionStatus.SENT,
          subtotal: calculatedSubtotal,
          discountAmount: calculatedTotalDiscount,
          taxAmount: calculatedTax,
          totalAmount: calculatedTotal,
          customerNote: dto.message || null,
          internalNote: counterEvalNote,
          items: {
            create: revisionItemsData,
          },
        },
      });

      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.NEGOTIATING,
          currentRevisionId: revision.id,
        },
      });

      const deal = await tx.deal.findUnique({
        where: { id: quotation.dealId },
      });
      if (
        deal &&
        (deal.stage === DealStage.NEW ||
          deal.stage === DealStage.QUALIFICATION ||
          deal.stage === DealStage.REQUIREMENT ||
          deal.stage === DealStage.QUOTATION)
      ) {
        await tx.deal.update({
          where: { id: deal.id },
          data: { stage: DealStage.NEGOTIATION },
        });
      }

      const refreshed = await this.quotationRepo.findById(quotationId, tx);
      const refreshedDto = toQuotationDto(refreshed!);
      refreshedDto.discountEvaluation = counterDiscountEvaluation;
      return refreshedDto;
    });
  }

  private calculateQuotationTotals(
    items: CreateQuotationItemDto[] = [],
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

    const itemsToCreate = (items || []).map((item) => {
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

  private async generateQuotationNo(tx: TransactionClient): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.quotationRepo.countQuotations(tx);
    let seqNum = count + 1;
    let quotationNo = `QT-${year}${month}-${String(seqNum).padStart(4, "0")}`;

    while (await this.quotationRepo.findByQuotationNo(quotationNo, tx)) {
      seqNum += 1;
      quotationNo = `QT-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }

    return quotationNo;
  }
}

export const quotationService = new QuotationService();
