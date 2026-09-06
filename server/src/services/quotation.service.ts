import {
  Prisma,
  QuotationStatus,
  DiscountType,
  RevisionType,
  RevisionStatus,
  DealStage,
  DealStatus,
  NegotiationStatus,
  CompanyUserRole,
  SalesOrderStatus,
  DeliveryStatus,
  BackorderStatus,
  InvoiceStatus,
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
import {
  SalesOrderRepository,
  salesOrderRepository as defaultSalesOrderRepository,
} from "../repositories/salesOrder.repository";
import {
  DeliveryRepository,
  deliveryRepository as defaultDeliveryRepository,
} from "../repositories/delivery.repository";
import {
  InvoiceRepository,
  invoiceRepository as defaultInvoiceRepository,
} from "../repositories/invoice.repository";
import {
  BackorderRepository,
  backorderRepository as defaultBackorderRepository,
} from "../repositories/backorder.repository";
import {
  WarehouseRepository,
  warehouseRepository as defaultWarehouseRepository,
} from "../repositories/warehouse.repository";
import {
  ProductRepository,
  productRepository as defaultProductRepository,
} from "../repositories/product.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { prisma as defaultPrisma } from "../lib/prisma";
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
  SubmitNegotiationDto,
  ApproveNegotiationDto,
  RejectNegotiationDto,
  FulfillQuotationDto,
  FulfillmentResultDto,
  FulfillmentSummaryResponseDto,
  NegotiationResponseDto,
  toQuotationDto,
  toQuotationItemDto,
  toQuotationRevisionDto,
  toNegotiationDto,
} from "../dto/quotation.dto";
import { toSalesOrderDto } from "../dto/salesOrder.dto";
import { DeliveryResponseDto, toDeliveryDto } from "../dto/delivery.dto";
import { InvoiceResponseDto, toInvoiceDto } from "../dto/invoice.dto";
import { BackorderResponseDto, toBackorderDto } from "../dto/backorder.dto";
import { toDealDto } from "../dto/deal.dto";
import { customerDiscountTierConverter } from "../converters/companySetting.converter";
import {
  calculateDiscountViolations,
  DiscountLineItemInput,
  DiscountViolationEvaluation,
  RiskLevel,
} from "../utils/discount-violation.util";

interface DeliverableLineItem {
  salesOrderItemId: string;
  productId: string;
  orderedQuantity: number;
  deliverableQuantity: number;
  backorderQuantity: number;
  warehouseId: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  finalUnitPrice: number;
}

interface EvaluatedFulfillmentLines {
  deliveredLines: DeliverableLineItem[];
  backorderLines: DeliverableLineItem[];
}

export class QuotationService {
  private quotationRepo: QuotationRepository;
  private companyRepo: CompanyRepository;
  private userRepo: UserRepository;
  private dealRepo: DealRepository;
  private salesOrderRepo: SalesOrderRepository;
  private deliveryRepo: DeliveryRepository;
  private invoiceRepo: InvoiceRepository;
  private backorderRepo: BackorderRepository;
  private warehouseRepo: WarehouseRepository;
  private productRepo: ProductRepository;

  public constructor(
    quotationRepo: QuotationRepository = defaultQuotationRepository,
    companyRepo: CompanyRepository = defaultCompanyRepository,
    userRepo: UserRepository = defaultUserRepository,
    dealRepo: DealRepository = defaultDealRepository,
    salesOrderRepo: SalesOrderRepository = defaultSalesOrderRepository,
    deliveryRepo: DeliveryRepository = defaultDeliveryRepository,
    invoiceRepo: InvoiceRepository = defaultInvoiceRepository,
    backorderRepo: BackorderRepository = defaultBackorderRepository,
    warehouseRepo: WarehouseRepository = defaultWarehouseRepository,
    productRepo: ProductRepository = defaultProductRepository,
  ) {
    this.quotationRepo = quotationRepo;
    this.companyRepo = companyRepo;
    this.userRepo = userRepo;
    this.dealRepo = dealRepo;
    this.salesOrderRepo = salesOrderRepo;
    this.deliveryRepo = deliveryRepo;
    this.invoiceRepo = invoiceRepo;
    this.backorderRepo = backorderRepo;
    this.warehouseRepo = warehouseRepo;
    this.productRepo = productRepo;
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
        unitPriceNum - discountAmt / quantity,
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
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation item not found");
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
        return toQuotationDto(quotation);
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

    const midConfig = await this.companyRepo.findConfig(
      quotation.companyId,
      "MANAGER_APPROVAL_THRESHOLD",
      tx,
    );
    const midThreshold =
      midConfig?.configValue && !isNaN(Number(midConfig.configValue))
        ? Number(midConfig.configValue)
        : 15;

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

    return calculateDiscountViolations(
      discountInputs,
      blendedThreshold,
      midThreshold,
    );
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
      dto.discountEvaluation =
        await this.evaluateDiscountViolations(quotationId);
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
      const memberships =
        await this.companyRepo.findUserCompanies(requestingUserId);
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
        { customer: { userName: { contains: filters.search, mode: "insensitive" } } },
        { customer: { email: { contains: filters.search, mode: "insensitive" } } },
        { deal: { name: { contains: filters.search, mode: "insensitive" } } },
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
    excludeDraft: boolean = false,
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
      if (excludeDraft && filters.status === QuotationStatus.DRAFT) {
        where.status = {
          not: QuotationStatus.DRAFT,
        };
      } else {
        where.status = filters.status;
      }
    } else if (excludeDraft) {
      where.status = {
        not: QuotationStatus.DRAFT,
      };
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
        quotation.status !== QuotationStatus.NEGOTIATING &&
        quotation.status !== QuotationStatus.SENT
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
          quotation.status === QuotationStatus.DRAFT
            ? RevisionStatus.DRAFT
            : RevisionStatus.SENT,
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
        ...(quotation.status === QuotationStatus.NEGOTIATING ||
        quotation.status === QuotationStatus.SENT
          ? { status: QuotationStatus.SENT }
          : {}),
      };

      if (quotation.status === QuotationStatus.NEGOTIATING) {
        await tx.negotiation.updateMany({
          where: { quotationId, status: NegotiationStatus.PENDING },
          data: {
            status: NegotiationStatus.APPROVED,
            approvedBy: requestingUserId,
            approvedAt: new Date(),
          },
        });
      }

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
        if (quotation.status === QuotationStatus.ACCEPTED) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Quotation has already been accepted",
          );
        }

        if (quotation.status === QuotationStatus.NEGOTIATING) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Cannot approve quotation while it is under negotiation. Please wait for internal review or conclusion of the negotiation.",
          );
        }

        if (quotation.status !== QuotationStatus.SENT) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Cannot approve a quotation with status ${quotation.status}. Quotation must be in SENT status to be accepted by customer.`,
          );
        }

        if (quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Quotation has expired and can no longer be accepted",
          );
        }

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

  public async customerApproveQuotation(
    companyId: string,
    quotationId: string,
    requestingUserId: string,
    notes?: string,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation || quotation.companyId !== companyId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (quotation.customerId !== requestingUserId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Only the designated customer can approve this quotation",
        );
      }

      if (quotation.status === QuotationStatus.ACCEPTED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Quotation has already been accepted",
        );
      }

      if (quotation.status === QuotationStatus.NEGOTIATING) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot approve quotation while it is under negotiation. Please wait for the negotiation review to conclude or submit a counter proposal.",
        );
      }

      if (quotation.status !== QuotationStatus.SENT) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot approve a quotation with status ${quotation.status}. Quotation must be in SENT status to be accepted by the customer.`,
        );
      }

      if (quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Quotation has expired and can no longer be accepted",
        );
      }

      if (quotation.currentRevisionId) {
        await tx.quotationRevision.update({
          where: { id: quotation.currentRevisionId },
          data: {
            status: RevisionStatus.ACCEPTED,
            customerNote:
              notes || quotation.currentRevision?.customerNote || null,
          },
        });
      }

      const updated = await this.quotationRepo.update(
        quotationId,
        {
          status: QuotationStatus.ACCEPTED,
        },
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
    requestingUserId: string,
    dto?: RejectQuotationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      if (quotation.customerId !== requestingUserId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Only the customer assigned to this quotation can reject it",
        );
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

      // Close any pending negotiations when customer rejects the quotation.
      await tx.negotiation.updateMany({
        where: { quotationId, status: NegotiationStatus.PENDING },
        data: {
          status: NegotiationStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: "Quotation rejected by customer",
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

  public async submitNegotiation(
    quotationId: string,
    requestingUserId: string,
    dto: SubmitNegotiationDto,
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

      const negotiationItemsData: Array<{
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
          const finalUnitPrice = quantity.gt(0) ? lineBase.div(quantity) : unitPrice;
          const lineTax = lineBase.mul(taxRate).div(100);
          const lineTotal = lineBase.add(lineTax);

          calculatedSubtotal = calculatedSubtotal.add(unitPrice.mul(quantity));
          calculatedTotalDiscount = calculatedTotalDiscount.add(discountAmount);
          calculatedTax = calculatedTax.add(lineTax);
          calculatedTotal = calculatedTotal.add(lineTotal);

          negotiationItemsData.push({
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
          const discountType = existing.discountType;
          const discountValue = new Prisma.Decimal(existing.discountValue);
          const taxRate = new Prisma.Decimal(existing.taxRate);
          const discountAmount = new Prisma.Decimal(existing.discountAmount);
          const finalUnitPrice = new Prisma.Decimal(existing.finalUnitPrice);
          const lineTotal = new Prisma.Decimal(existing.lineTotal);

          calculatedSubtotal = calculatedSubtotal.add(unitPrice.mul(quantity));
          calculatedTotalDiscount = calculatedTotalDiscount.add(discountAmount);
          calculatedTax = calculatedTax.add(
            lineTotal.sub(unitPrice.mul(quantity).sub(discountAmount)),
          );
          calculatedTotal = calculatedTotal.add(lineTotal);

          negotiationItemsData.push({
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

      const midConfig = await this.companyRepo.findConfig(
        quotation.companyId,
        "MANAGER_APPROVAL_THRESHOLD",
        tx,
      );
      const midThreshold =
        midConfig?.configValue && !isNaN(Number(midConfig.configValue))
          ? Number(midConfig.configValue)
          : 15;

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
        midThreshold,
      );
      const counterEvalNote = `Negotiation Discount Evaluation: maxLineViolation=${counterDiscountEvaluation.maxLineViolation}%, blendedViolationScore=${counterDiscountEvaluation.blendedViolationScore}%, riskLevel=${counterDiscountEvaluation.riskLevel}, requiredApproval=${counterDiscountEvaluation.requiredApprovalRole || "NONE"}`;

      const revisionCount = await tx.quotationRevision.count({
        where: { quotationId },
      });

      const isLowRisk = counterDiscountEvaluation.riskLevel === RiskLevel.LOW;

      await tx.negotiation.create({
        data: {
          quotationId,
          status: isLowRisk ? NegotiationStatus.APPROVED : NegotiationStatus.PENDING,
          message: dto.message || null,
          riskScore: new Prisma.Decimal(counterDiscountEvaluation.blendedViolationScore),
          riskLevel: counterDiscountEvaluation.riskLevel,
          requiredRole: counterDiscountEvaluation.requiredApprovalRole || null,
          approvedAt: isLowRisk ? new Date() : null,
          items: {
            create: negotiationItemsData,
          },
        },
      });

      if (isLowRisk) {
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
            internalNote: `${counterEvalNote} | Auto-approved (Low Risk)`,
            items: {
              create: revisionItemsData,
            },
          },
        });

        await this.quotationRepo.deleteItemsByQuotationId(quotationId, tx);
        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.SENT,
            currentRevisionId: revision.id,
            items: {
              create: revisionItemsData.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discountType: it.discountType,
                discountValue: it.discountValue,
                discountAmount: it.discountAmount,
                taxRate: it.taxRate,
                finalUnitPrice: it.finalUnitPrice,
                lineTotal: it.lineTotal,
              })),
            },
          },
        });
      } else {
        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.NEGOTIATING,
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
      }

      const refreshed = await this.quotationRepo.findById(quotationId, tx);
      const refreshedDto = toQuotationDto(refreshed!);
      refreshedDto.discountEvaluation = counterDiscountEvaluation;
      return refreshedDto;
    });
  }

  // Alias for backward compatibility
  public async submitCounterOffer(
    quotationId: string,
    requestingUserId: string,
    dto: SubmitNegotiationDto,
  ): Promise<QuotationResponseDto> {
    return this.submitNegotiation(quotationId, requestingUserId, dto);
  }

  public async approveNegotiation(
    companyId: string,
    quotationId: string,
    negotiationId: string,
    reviewerUserId: string,
    reviewerRole: CompanyUserRole,
    dto?: ApproveNegotiationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation || quotation.companyId !== companyId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      const negotiation = await tx.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
          items: true,
        },
      });

      if (!negotiation || negotiation.quotationId !== quotationId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Negotiation not found");
      }

      if (negotiation.status !== NegotiationStatus.PENDING) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot approve negotiation with status ${negotiation.status}`,
        );
      }

      this.validateReviewerApprovalPermission(
        reviewerRole,
        reviewerUserId,
        quotation.company.ownerId,
        negotiation.requiredRole as CompanyUserRole | null,
      );

      if (negotiation.items.length > 0) {
        const productIds = negotiation.items.map((i) => i.productId);
        const products = await this.quotationRepo.findProductsByIds(
          productIds,
          companyId,
          tx,
        );
        const productMap = new Map(products.map((p) => [p.id, p]));

        const calculated = this.calculateQuotationTotals(
          negotiation.items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.requestedQuantity),
            unitPrice: Number(item.requestedUnitPrice),
            discountType: item.requestedDiscountType,
            discountValue: Number(item.requestedDiscountValue),
          })),
          productMap,
        );

        await this.quotationRepo.deleteItemsByQuotationId(quotationId, tx);

        const revision = await this.quotationRepo.createRevision(
          quotationId,
          reviewerUserId,
          RevisionType.CUSTOMER_COUNTER,
          RevisionStatus.SENT,
          {
            subtotal: calculated.subtotal,
            discountAmount: calculated.totalDiscount,
            taxAmount: calculated.taxAmount,
            totalAmount: calculated.total,
            customerNote: negotiation.message || null,
            internalNote: dto?.notes || `Approved by ${reviewerRole} (${reviewerUserId})`,
          },
          calculated.itemsToCreate,
          tx,
        );

        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.SENT,
            currentRevisionId: revision.id,
            items: {
              create: calculated.itemsToCreate.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discountType: it.discountType,
                discountValue: it.discountValue,
                discountAmount: it.discountAmount,
                taxRate: it.taxRate,
                finalUnitPrice: it.finalUnitPrice,
                lineTotal: it.lineTotal,
              })),
            },
          },
        });
      } else {
        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.SENT,
          },
        });
      }

      await tx.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: NegotiationStatus.APPROVED,
          approvedBy: reviewerUserId,
          approvedAt: new Date(),
        },
      });

      const updated = await this.quotationRepo.findById(quotationId, tx);
      return toQuotationDto(updated!);
    });
  }

  public async rejectNegotiation(
    companyId: string,
    quotationId: string,
    negotiationId: string,
    reviewerUserId: string,
    reviewerRole: CompanyUserRole,
    dto?: RejectNegotiationDto,
  ): Promise<QuotationResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation || quotation.companyId !== companyId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      const negotiation = await tx.negotiation.findUnique({
        where: { id: negotiationId },
      });

      if (!negotiation || negotiation.quotationId !== quotationId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Negotiation not found");
      }

      if (negotiation.status !== NegotiationStatus.PENDING) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Cannot reject negotiation with status ${negotiation.status}`,
        );
      }

      const isAuthorizedStaff =
        reviewerRole === CompanyUserRole.ADMIN ||
        reviewerRole === CompanyUserRole.SALES_MANAGER ||
        reviewerRole === CompanyUserRole.FINANCE_MANAGER ||
        quotation.company.ownerId === reviewerUserId;

      if (!isAuthorizedStaff) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Only authorized staff can reject negotiations",
        );
      }

      await tx.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: NegotiationStatus.REJECTED,
          rejectedBy: reviewerUserId,
          rejectedAt: new Date(),
          rejectionReason: dto?.reason || "Rejected by reviewer",
        },
      });

      const remainingPending = await tx.negotiation.count({
        where: {
          quotationId,
          status: NegotiationStatus.PENDING,
        },
      });

      if (remainingPending === 0) {
        await tx.quotation.update({
          where: { id: quotationId },
          data: {
            status: QuotationStatus.SENT,
          },
        });
      }

      const updated = await this.quotationRepo.findById(quotationId, tx);
      return toQuotationDto(updated!);
    });
  }

  private validateReviewerApprovalPermission(
    reviewerRole: CompanyUserRole,
    reviewerUserId: string,
    companyOwnerId: string,
    requiredRole: CompanyUserRole | null,
  ): void {
    const isAdmin =
      reviewerRole === CompanyUserRole.ADMIN ||
      companyOwnerId === reviewerUserId;

    if (!isAdmin && requiredRole) {
      if (
        requiredRole === CompanyUserRole.FINANCE_MANAGER &&
        reviewerRole !== CompanyUserRole.FINANCE_MANAGER
      ) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "This high-risk quotation requires approval by a Finance Manager",
        );
      }
      if (
        requiredRole === CompanyUserRole.SALES_MANAGER &&
        reviewerRole !== CompanyUserRole.SALES_MANAGER &&
        reviewerRole !== CompanyUserRole.FINANCE_MANAGER
      ) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "This quotation requires approval by a Sales Manager or Finance Manager",
        );
      }
    }
  }

  public async fulfillQuotation(
    companyId: string,
    quotationId: string,
    _userId: string,
    dto: FulfillQuotationDto,
  ): Promise<FulfillmentResultDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const quotation = await this.quotationRepo.findById(quotationId, tx);
      if (!quotation || quotation.companyId !== companyId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
      }

      this.validateQuotationCanBeFulfilled(quotation);

      const defaultWarehouseId = await this.resolveDefaultWarehouseId(
        companyId,
        dto.warehouseId,
        tx,
      );

      const salesOrder = await this.getOrCreateSalesOrderForQuotation(
        quotation,
        companyId,
        dto.notes,
        tx,
      );

      const { deliveredLines, backorderLines } =
        await this.evaluateStockAndDeliverableLines(
          salesOrder,
          companyId,
          defaultWarehouseId,
          dto.items,
          tx,
        );

      let createdDelivery: DeliveryResponseDto | null = null;
      let createdInvoice: InvoiceResponseDto | null = null;
      let createdBackorder: BackorderResponseDto | null = null;

      if (deliveredLines.length > 0) {
        createdDelivery = await this.createFulfillmentDelivery(
          companyId,
          salesOrder,
          deliveredLines,
          dto,
          tx,
        );

        createdInvoice = await this.createFulfillmentInvoice(
          companyId,
          quotation,
          salesOrder,
          createdDelivery.id,
          deliveredLines,
          dto,
          tx,
        );
      }

      if (backorderLines.length > 0) {
        createdBackorder = await this.createFulfillmentBackorder(
          companyId,
          salesOrder.id,
          backorderLines,
          dto.notes,
          tx,
        );
      } else {
        await this.finalizeSalesOrderAndDeal(
          salesOrder.id,
          quotation.dealId,
          tx,
        );
      }

      return this.assembleFulfillmentResult(
        quotationId,
        salesOrder.id,
        quotation.dealId,
        companyId,
        createdDelivery,
        createdInvoice,
        createdBackorder,
        tx,
      );
    });
  }

  private validateQuotationCanBeFulfilled(quotation: {
    status: QuotationStatus;
    items?: Array<unknown>;
  }): void {
    if (quotation.status !== QuotationStatus.ACCEPTED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot fulfill a quotation with status ${quotation.status}. Quotation must be ACCEPTED first.`,
      );
    }

    if (!quotation.items || quotation.items.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot fulfill a quotation with no line items",
      );
    }
  }

  private async resolveDefaultWarehouseId(
    companyId: string,
    requestedWarehouseId: string | undefined,
    tx: TransactionClient,
  ): Promise<string> {
    if (!requestedWarehouseId) {
      const result = await this.warehouseRepo.findMany(companyId, 1, 1, tx);
      if (result.warehouses.length > 0) {
        return result.warehouses[0].id;
      }
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "No warehouse available for fulfillment. Please create or specify a warehouse.",
      );
    }

    const warehouse = await this.warehouseRepo.findById(
      requestedWarehouseId,
      companyId,
      tx,
    );
    if (!warehouse) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Warehouse not found");
    }
    return requestedWarehouseId;
  }

  private async getOrCreateSalesOrderForQuotation(
    quotation: {
      id: string;
      customerId: string;
      salesRepId: string | null;
      currency: string;
      items?: Array<{
        id: string;
        productId: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        finalUnitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }>;
    },
    companyId: string,
    notes: string | null | undefined,
    tx: TransactionClient,
  ) {
    let salesOrder = await tx.salesOrder.findFirst({
      where: { quotationId: quotation.id, companyId },
      include: {
        items: true,
        customer: true,
        salesRep: true,
        company: true,
      },
    });

    if (!salesOrder) {
      const orderNo = await this.generateSalesOrderNo(tx);
      let subtotal = new Prisma.Decimal(0);
      let discountAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);
      let totalAmount = new Prisma.Decimal(0);

      const items = quotation.items || [];
      const orderItemsData = items.map((qItem) => {
        subtotal = subtotal.add(qItem.unitPrice.mul(qItem.quantity));
        discountAmount = discountAmount.add(qItem.discountAmount);
        taxAmount = taxAmount.add(
          qItem.lineTotal.sub(
            qItem.unitPrice.mul(qItem.quantity).sub(qItem.discountAmount),
          ),
        );
        totalAmount = totalAmount.add(qItem.lineTotal);

        return {
          productId: qItem.productId,
          quotationItemId: qItem.id,
          orderedQuantity: qItem.quantity,
          deliveredQuantity: new Prisma.Decimal(0),
          invoicedQuantity: new Prisma.Decimal(0),
          unitPrice: qItem.unitPrice,
          discount: qItem.discountAmount,
          taxRate: qItem.taxRate,
          finalUnitPrice: qItem.finalUnitPrice,
          lineTotal: qItem.lineTotal,
        };
      });

      const createdOrder = await this.salesOrderRepo.create(
        {
          company: { connect: { id: companyId } },
          customer: { connect: { id: quotation.customerId } },
          salesRep: quotation.salesRepId
            ? { connect: { id: quotation.salesRepId } }
            : undefined,
          quotation: { connect: { id: quotation.id } },
          orderNo,
          status: SalesOrderStatus.CONFIRMED,
          currency: quotation.currency,
          subtotal: Number(subtotal.toFixed(2)),
          discountAmount: Number(discountAmount.toFixed(2)),
          taxAmount: Number(taxAmount.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
          notes: notes || null,
          items: {
            create: orderItemsData.map((item) => ({
              product: { connect: { id: item.productId } },
              quotationItemId: item.quotationItemId,
              orderedQuantity: item.orderedQuantity,
              deliveredQuantity: 0,
              invoicedQuantity: 0,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              finalUnitPrice: item.finalUnitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        tx,
      );

      salesOrder = await tx.salesOrder.findUnique({
        where: { id: createdOrder.id },
        include: {
          items: true,
          customer: true,
          salesRep: true,
          company: true,
        },
      });
    }

    if (!salesOrder) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to process sales order for quotation",
      );
    }

    return salesOrder;
  }

  private async evaluateStockAndDeliverableLines(
    salesOrder: {
      items: Array<{
        id: string;
        productId: string;
        orderedQuantity: Prisma.Decimal;
        deliveredQuantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        discount: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        finalUnitPrice: Prisma.Decimal;
      }>;
    },
    companyId: string,
    defaultWarehouseId: string,
    itemWarehouseOverrides:
      | Array<{ productId: string; warehouseId?: string; quantity?: number }>
      | undefined,
    tx: TransactionClient,
  ): Promise<EvaluatedFulfillmentLines> {
    const itemOverridesMap = new Map<
      string,
      Array<{ warehouseId?: string; quantity?: number }>
    >();
    if (itemWarehouseOverrides && itemWarehouseOverrides.length > 0) {
      for (const it of itemWarehouseOverrides) {
        const list = itemOverridesMap.get(it.productId) || [];
        list.push(it);
        itemOverridesMap.set(it.productId, list);
      }
    }

    const evaluatedLines: DeliverableLineItem[] = [];

    for (const orderItem of salesOrder.items) {
      const remainingToDeliver =
        Number(orderItem.orderedQuantity) - Number(orderItem.deliveredQuantity);
      if (remainingToDeliver <= 0) {
        continue;
      }

      const overrides = itemOverridesMap.get(orderItem.productId);
      if (overrides && overrides.length > 0) {
        let deliveredSoFar = 0;
        for (const override of overrides) {
          if (deliveredSoFar >= remainingToDeliver) break;
          const targetWarehouseId = override.warehouseId || defaultWarehouseId;
          const wh = await this.warehouseRepo.findById(
            targetWarehouseId,
            companyId,
            tx,
          );
          if (!wh) {
            throw new ApiError(
              StatusCodes.NOT_FOUND,
              `Warehouse ${targetWarehouseId} not found`,
            );
          }

          const stockRecord = await tx.productStock.findUnique({
            where: {
              productId_warehouseId: {
                productId: orderItem.productId,
                warehouseId: targetWarehouseId,
              },
            },
          });

          const availableStock = stockRecord ? Number(stockRecord.stockQty) : 0;
          const needed = remainingToDeliver - deliveredSoFar;
          const requestedQty =
            override.quantity !== undefined
              ? Math.min(override.quantity, needed)
              : needed;
          const deliverableQuantity = Math.max(
            0,
            Math.min(availableStock, requestedQty),
          );

          if (deliverableQuantity > 0) {
            deliveredSoFar += deliverableQuantity;
            evaluatedLines.push({
              salesOrderItemId: orderItem.id,
              productId: orderItem.productId,
              orderedQuantity: remainingToDeliver,
              deliverableQuantity,
              backorderQuantity: 0,
              warehouseId: targetWarehouseId,
              unitPrice: Number(orderItem.unitPrice),
              discount: Number(orderItem.discount),
              taxRate: Number(orderItem.taxRate),
              finalUnitPrice: Number(orderItem.finalUnitPrice),
            });

            if (stockRecord) {
              const newStockQty = Number(
                (availableStock - deliverableQuantity).toFixed(4),
              );
              await tx.productStock.update({
                where: { id: stockRecord.id },
                data: { stockQty: new Prisma.Decimal(newStockQty) },
              });
            }
          }
        }

        const remainingBackorder = Math.max(
          0,
          remainingToDeliver - deliveredSoFar,
        );
        if (remainingBackorder > 0) {
          evaluatedLines.push({
            salesOrderItemId: orderItem.id,
            productId: orderItem.productId,
            orderedQuantity: remainingToDeliver,
            deliverableQuantity: 0,
            backorderQuantity: remainingBackorder,
            warehouseId: defaultWarehouseId,
            unitPrice: Number(orderItem.unitPrice),
            discount: Number(orderItem.discount),
            taxRate: Number(orderItem.taxRate),
            finalUnitPrice: Number(orderItem.finalUnitPrice),
          });
        }
      } else {
        const targetWarehouseId = defaultWarehouseId;
        const wh = await this.warehouseRepo.findById(
          targetWarehouseId,
          companyId,
          tx,
        );
        if (!wh) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            `Warehouse ${targetWarehouseId} not found`,
          );
        }

        const stockRecord = await tx.productStock.findUnique({
          where: {
            productId_warehouseId: {
              productId: orderItem.productId,
              warehouseId: targetWarehouseId,
            },
          },
        });

        const availableStock = stockRecord ? Number(stockRecord.stockQty) : 0;
        const deliverableQuantity = Math.max(
          0,
          Math.min(availableStock, remainingToDeliver),
        );
        const backorderQuantity = Math.max(
          0,
          remainingToDeliver - deliverableQuantity,
        );

        evaluatedLines.push({
          salesOrderItemId: orderItem.id,
          productId: orderItem.productId,
          orderedQuantity: remainingToDeliver,
          deliverableQuantity,
          backorderQuantity,
          warehouseId: targetWarehouseId,
          unitPrice: Number(orderItem.unitPrice),
          discount: Number(orderItem.discount),
          taxRate: Number(orderItem.taxRate),
          finalUnitPrice: Number(orderItem.finalUnitPrice),
        });

        if (deliverableQuantity > 0 && stockRecord) {
          const newStockQty = Number(
            (availableStock - deliverableQuantity).toFixed(4),
          );
          await tx.productStock.update({
            where: { id: stockRecord.id },
            data: { stockQty: new Prisma.Decimal(newStockQty) },
          });
        }
      }
    }

    return {
      deliveredLines: evaluatedLines.filter((l) => l.deliverableQuantity > 0),
      backorderLines: evaluatedLines.filter((l) => l.backorderQuantity > 0),
    };
  }

  private async createFulfillmentDelivery(
    companyId: string,
    salesOrder: {
      id: string;
      items: Array<{ id: string; deliveredQuantity: Prisma.Decimal }>;
    },
    deliveredLines: DeliverableLineItem[],
    dto: FulfillQuotationDto,
    tx: TransactionClient,
  ): Promise<DeliveryResponseDto> {
    const deliveryNo = await this.generateDeliveryNo(tx);
    const delivery = await this.deliveryRepo.create(
      {
        company: { connect: { id: companyId } },
        salesOrder: { connect: { id: salesOrder.id } },
        deliveryNo,
        status: DeliveryStatus.DELIVERED,
        trackingNumber: dto.trackingNumber,
        shippedAt: new Date(),
        deliveredAt: new Date(),
        notes: dto.notes,
        items: {
          create: deliveredLines.map((l) => ({
            salesOrderItem: { connect: { id: l.salesOrderItemId } },
            product: { connect: { id: l.productId } },
            deliveredQuantity: l.deliverableQuantity,
          })),
        },
      },
      tx,
    );

    for (const l of deliveredLines) {
      const oi = salesOrder.items.find((i) => i.id === l.salesOrderItemId)!;
      const newDelivered = Number(oi.deliveredQuantity) + l.deliverableQuantity;
      await this.salesOrderRepo.updateItem(
        l.salesOrderItemId,
        { deliveredQuantity: newDelivered },
        tx,
      );
    }

    const loadedDelivery = await this.deliveryRepo.findByIdWithRelations(
      delivery.id,
      companyId,
      tx,
    );
    return toDeliveryDto(loadedDelivery!);
  }

  private async createFulfillmentInvoice(
    companyId: string,
    quotation: { customerId: string; currency: string },
    salesOrder: {
      id: string;
      items: Array<{ id: string; invoicedQuantity: Prisma.Decimal }>;
    },
    deliveryId: string,
    deliveredLines: DeliverableLineItem[],
    dto: FulfillQuotationDto,
    tx: TransactionClient,
  ): Promise<InvoiceResponseDto> {
    let invSubtotal = 0;
    let invDiscount = 0;
    let invTax = 0;
    let invTotal = 0;

    const invoiceItemsData = deliveredLines.map((l) => {
      const gross = l.deliverableQuantity * l.unitPrice;
      const ratio =
        l.orderedQuantity > 0 ? l.deliverableQuantity / l.orderedQuantity : 1;
      const lineDiscount = Number((l.discount * ratio).toFixed(2));
      const taxable = Math.max(0, gross - lineDiscount);
      const lineTax = Number(((taxable * l.taxRate) / 100).toFixed(2));
      const lineTotal = Number((taxable + lineTax).toFixed(2));

      invSubtotal += gross;
      invDiscount += lineDiscount;
      invTax += lineTax;
      invTotal += lineTotal;

      return {
        salesOrderItemId: l.salesOrderItemId,
        productId: l.productId,
        deliveredQuantity: l.deliverableQuantity,
        unitPrice: l.unitPrice,
        discount: lineDiscount,
        tax: lineTax,
        lineTotal,
      };
    });

    invSubtotal = Number(invSubtotal.toFixed(2));
    invDiscount = Number(invDiscount.toFixed(2));
    invTax = Number(invTax.toFixed(2));
    invTotal = Number((invSubtotal - invDiscount + invTax).toFixed(2));

    const invoiceNo = await this.generateInvoiceNo(tx);
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await this.invoiceRepo.create(
      {
        company: { connect: { id: companyId } },
        salesOrder: { connect: { id: salesOrder.id } },
        customer: { connect: { id: quotation.customerId } },
        delivery: { connect: { id: deliveryId } },
        invoiceNo,
        status: InvoiceStatus.POSTED,
        issueDate,
        dueDate,
        currency: quotation.currency,
        paymentTerms: dto.paymentTerms || "Net 30",
        subtotal: invSubtotal,
        discount: invDiscount,
        tax: invTax,
        total: invTotal,
        paidAmount: 0,
        remainingAmount: invTotal,
        notes: dto.notes,
        items: {
          create: invoiceItemsData.map((it) => ({
            salesOrderItem: { connect: { id: it.salesOrderItemId } },
            product: { connect: { id: it.productId } },
            deliveredQuantity: it.deliveredQuantity,
            unitPrice: it.unitPrice,
            discount: it.discount,
            tax: it.tax,
            lineTotal: it.lineTotal,
          })),
        },
      },
      tx,
    );

    for (const it of invoiceItemsData) {
      const oi = salesOrder.items.find((i) => i.id === it.salesOrderItemId)!;
      const newInvoiced = Number(oi.invoicedQuantity) + it.deliveredQuantity;
      await this.salesOrderRepo.updateItem(
        it.salesOrderItemId,
        { invoicedQuantity: newInvoiced },
        tx,
      );
    }

    const loadedInvoice = await this.invoiceRepo.findByIdWithRelations(
      invoice.id,
      companyId,
      tx,
    );
    return toInvoiceDto(loadedInvoice!);
  }

  private async createFulfillmentBackorder(
    companyId: string,
    salesOrderId: string,
    backorderLines: DeliverableLineItem[],
    notes: string | null | undefined,
    tx: TransactionClient,
  ): Promise<BackorderResponseDto> {
    const totalRemaining = backorderLines.reduce(
      (sum, l) => sum + l.backorderQuantity,
      0,
    );
    const backorderNo = await this.generateBackorderNo(tx);

    const backorder = await this.backorderRepo.create(
      {
        company: { connect: { id: companyId } },
        salesOrder: { connect: { id: salesOrderId } },
        backorderNo,
        status: BackorderStatus.PENDING,
        totalQuantity: totalRemaining,
        fulfilledQuantity: 0,
        remainingQuantity: totalRemaining,
        notes: notes || null,
        items: {
          create: backorderLines.map((l) => ({
            salesOrderItem: { connect: { id: l.salesOrderItemId } },
            product: { connect: { id: l.productId } },
            orderedQuantity: l.backorderQuantity,
            fulfilledQuantity: 0,
            remainingQuantity: l.backorderQuantity,
          })),
        },
      },
      tx,
    );

    await this.salesOrderRepo.update(
      salesOrderId,
      { status: SalesOrderStatus.PARTIALLY_DELIVERED },
      tx,
    );

    const loadedBackorder = await this.backorderRepo.findByIdWithRelations(
      backorder.id,
      companyId,
      tx,
    );
    return toBackorderDto(loadedBackorder!);
  }

  private async finalizeSalesOrderAndDeal(
    salesOrderId: string,
    dealId: string,
    tx: TransactionClient,
  ): Promise<void> {
    await this.salesOrderRepo.update(
      salesOrderId,
      { status: SalesOrderStatus.DELIVERED },
      tx,
    );

    await tx.deal.update({
      where: { id: dealId },
      data: {
        stage: DealStage.WON,
        status: DealStatus.WON,
      },
    });
  }

  private async assembleFulfillmentResult(
    quotationId: string,
    salesOrderId: string,
    dealId: string,
    companyId: string,
    delivery: DeliveryResponseDto | null,
    invoice: InvoiceResponseDto | null,
    backorder: BackorderResponseDto | null,
    tx: TransactionClient,
  ): Promise<FulfillmentResultDto> {
    const refreshedOrder = await this.salesOrderRepo.findByIdWithRelations(
      salesOrderId,
      companyId,
      tx,
    );
    const refreshedQuotation = await this.quotationRepo.findById(
      quotationId,
      tx,
    );
    const refreshedDeal = await this.dealRepo.findById(dealId, tx);

    return {
      quotation: toQuotationDto(refreshedQuotation!),
      salesOrder: toSalesOrderDto(refreshedOrder!),
      delivery,
      invoice,
      backorder,
      deal: refreshedDeal ? toDealDto(refreshedDeal) : undefined,
    };
  }

  private async generateSalesOrderNo(tx?: TransactionClient): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.salesOrderRepo.countOrders(tx);
    let seqNum = count + 1;
    let orderNo = `SO-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    while (await this.salesOrderRepo.findByOrderNo(orderNo, tx)) {
      seqNum++;
      orderNo = `SO-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }
    return orderNo;
  }

  private async generateDeliveryNo(tx?: TransactionClient): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.deliveryRepo.countDeliveries(tx);
    let seqNum = count + 1;
    let deliveryNo = `DEL-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    while (await this.deliveryRepo.findByDeliveryNo(deliveryNo, tx)) {
      seqNum++;
      deliveryNo = `DEL-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }
    return deliveryNo;
  }

  private async generateInvoiceNo(tx?: TransactionClient): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.invoiceRepo.countInvoices(tx);
    let seqNum = count + 1;
    let invoiceNo = `INV-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    while (await this.invoiceRepo.findByInvoiceNo(invoiceNo, tx)) {
      seqNum++;
      invoiceNo = `INV-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }
    return invoiceNo;
  }

  private async generateBackorderNo(tx?: TransactionClient): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await this.backorderRepo.countBackorders(tx);
    let seqNum = count + 1;
    let backorderNo = `BO-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    while (await this.backorderRepo.findByBackorderNo(backorderNo, tx)) {
      seqNum++;
      backorderNo = `BO-${year}${month}-${String(seqNum).padStart(4, "0")}`;
    }
    return backorderNo;
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

    const finalTotalDiscountNum = itemDiscountSum + (extraDiscountAmount || 0);
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

  public async getFulfillmentSummary(
    companyId: string,
  ): Promise<FulfillmentSummaryResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const [readyCount, partialCount, backorderCount, completedCount] =
      await Promise.all([
        defaultPrisma.quotation.count({
          where: {
            companyId,
            status: QuotationStatus.ACCEPTED,
            salesOrders: {
              none: {
                status: {
                  in: [
                    SalesOrderStatus.PARTIALLY_DELIVERED,
                    SalesOrderStatus.DELIVERED,
                  ],
                },
              },
            },
          },
        }),
        defaultPrisma.salesOrder.count({
          where: {
            companyId,
            status: SalesOrderStatus.PARTIALLY_DELIVERED,
          },
        }),
        defaultPrisma.backorder.count({
          where: {
            companyId,
            status: {
              in: [BackorderStatus.PENDING, BackorderStatus.PARTIALLY_FULFILLED],
            },
          },
        }),
        defaultPrisma.salesOrder.count({
          where: {
            companyId,
            status: SalesOrderStatus.DELIVERED,
          },
        }),
      ]);

    return {
      readyToFulfillCount: readyCount,
      partiallyFulfilledCount: partialCount,
      backorderedCount: backorderCount,
      completedCount: completedCount,
    };
  }
}

export const quotationService = new QuotationService();
