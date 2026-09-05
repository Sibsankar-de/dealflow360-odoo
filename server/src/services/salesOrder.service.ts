import { Prisma, SalesOrderStatus, QuotationStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  SalesOrderRepository,
  salesOrderRepository as defaultSalesOrderRepository,
} from "../repositories/salesOrder.repository";
import {
  QuotationRepository,
  quotationRepository as defaultQuotationRepository,
} from "../repositories/quotation.repository";
import {
  ProductRepository,
  productRepository as defaultProductRepository,
} from "../repositories/product.repository";
import {
  DeliveryService,
  deliveryService as defaultDeliveryService,
} from "./delivery.service";
import { ApiError } from "../utils/apiErrorHandler";
import {
  prismaTransaction,
  TransactionClient,
} from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CreateSalesOrderDto,
  SalesOrderFilterDto,
  DeliverOrderDto,
  SalesOrderResponseDto,
  toSalesOrderDto,
} from "../dto/salesOrder.dto";
import { DeliveryResponseDto } from "../dto/delivery.dto";

export class SalesOrderService {
  private salesOrderRepo: SalesOrderRepository;
  private quotationRepo: QuotationRepository;
  private productRepo: ProductRepository;
  private deliveryService: DeliveryService;

  public constructor(
    salesOrderRepo: SalesOrderRepository = defaultSalesOrderRepository,
    quotationRepo: QuotationRepository = defaultQuotationRepository,
    productRepo: ProductRepository = defaultProductRepository,
    deliveryService: DeliveryService = defaultDeliveryService,
  ) {
    this.salesOrderRepo = salesOrderRepo;
    this.quotationRepo = quotationRepo;
    this.productRepo = productRepo;
    this.deliveryService = deliveryService;
  }

  private async generateOrderNo(tx?: TransactionClient): Promise<string> {
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

  public async createSalesOrder(
    companyId: string,
    userId: string,
    dto: CreateSalesOrderDto,
  ): Promise<SalesOrderResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      let customerId = dto.customerId;
      let salesRepId = dto.salesRepId || userId;
      let currency = dto.currency || "USD";
      const quotationId: string | null = dto.quotationId || null;

      interface PreparedItem {
        productId: string;
        quotationItemId?: string | null;
        orderedQuantity: number;
        unitPrice: number;
        discount: number;
        taxRate: number;
        finalUnitPrice: number;
        lineTotal: number;
      }

      const preparedItems: PreparedItem[] = [];

      if (dto.quotationId) {
        const quotation = await this.quotationRepo.findById(
          dto.quotationId,
          tx,
        );

        if (!quotation || quotation.companyId !== companyId) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Quotation not found");
        }

        if (quotation.status !== QuotationStatus.ACCEPTED) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Cannot create a sales order from a quotation that is not ACCEPTED",
          );
        }

        customerId = quotation.customerId;
        salesRepId = quotation.salesRepId;
        currency = quotation.currency;

        for (const qItem of quotation.items) {
          const qty = Number(qItem.quantity);
          const unitPrice = Number(qItem.unitPrice);
          const discount = Number(qItem.discountAmount);
          const taxRate = Number(qItem.taxRate);
          const finalUnitPrice = Number(qItem.finalUnitPrice);
          const lineTotal = Number(qItem.lineTotal);

          preparedItems.push({
            productId: qItem.productId,
            quotationItemId: qItem.id,
            orderedQuantity: qty,
            unitPrice,
            discount,
            taxRate,
            finalUnitPrice,
            lineTotal,
          });
        }
      } else if (dto.items && dto.items.length > 0) {
        if (!customerId) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Customer ID is required when creating a direct sales order",
          );
        }

        const productIds = dto.items.map((i) => i.productId);
        const products = await this.quotationRepo.findProductsByIds(
          productIds,
          companyId,
          tx,
        );
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const itemDto of dto.items) {
          const product = productMap.get(itemDto.productId);
          if (!product) {
            throw new ApiError(
              StatusCodes.NOT_FOUND,
              `Product ${itemDto.productId} not found`,
            );
          }

          const qty = itemDto.orderedQuantity;
          const unitPrice =
            itemDto.unitPrice !== undefined
              ? itemDto.unitPrice
              : Number(product.price);
          const discount = itemDto.discount || 0;
          const taxRate = itemDto.taxRate || 0;
          const discountAmountPerUnit = qty > 0 ? discount / qty : 0;
          const finalUnitPrice = Number(
            (unitPrice - discountAmountPerUnit).toFixed(2),
          );
          const taxable = unitPrice * qty - discount;
          const taxAmount = Number(((taxable * taxRate) / 100).toFixed(2));
          const lineTotal = Number((taxable + taxAmount).toFixed(2));

          preparedItems.push({
            productId: itemDto.productId,
            quotationItemId: null,
            orderedQuantity: qty,
            unitPrice,
            discount,
            taxRate,
            finalUnitPrice,
            lineTotal,
          });
        }
      } else {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Either quotationId or items must be provided to create a sales order",
        );
      }

      const subtotal = Number(
        preparedItems
          .reduce((sum, i) => sum + i.unitPrice * i.orderedQuantity, 0)
          .toFixed(2),
      );
      const discountAmount = Number(
        preparedItems.reduce((sum, i) => sum + i.discount, 0).toFixed(2),
      );
      const taxableSum = subtotal - discountAmount;
      const taxAmount = Number(
        preparedItems
          .reduce((sum, i) => {
            const lineTaxable = i.unitPrice * i.orderedQuantity - i.discount;
            return sum + (lineTaxable * i.taxRate) / 100;
          }, 0)
          .toFixed(2),
      );
      const totalAmount = Number((taxableSum + taxAmount).toFixed(2));

      const orderNo = await this.generateOrderNo(tx);

      const createdOrder = await this.salesOrderRepo.create(
        {
          company: { connect: { id: companyId } },
          customer: { connect: { id: customerId } },
          salesRep: salesRepId ? { connect: { id: salesRepId } } : undefined,
          quotation: quotationId ? { connect: { id: quotationId } } : undefined,
          orderNo,
          status: SalesOrderStatus.CONFIRMED,
          currency,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          notes: dto.notes,
          items: {
            create: preparedItems.map((item) => ({
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

      const loadedOrder = await this.salesOrderRepo.findByIdWithRelations(
        createdOrder.id,
        companyId,
        tx,
      );

      return toSalesOrderDto(loadedOrder!);
    });
  }

  public async getOrderById(
    orderId: string,
    companyId: string,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.salesOrderRepo.findByIdWithRelations(
      orderId,
      companyId,
    );
    if (!order) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Sales order not found");
    }
    return toSalesOrderDto(order);
  }

  public async listOrders(
    companyId: string,
    filters: SalesOrderFilterDto,
  ): Promise<PaginatedResult<SalesOrderResponseDto>> {
    const where: Prisma.SalesOrderWhereInput = { companyId };

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { orderNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const options = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    const paginated = await this.salesOrderRepo.list(where, options);
    return {
      ...paginated,
      docs: paginated.docs.map((o) => toSalesOrderDto(o)),
    };
  }

  public async deliverOrder(
    companyId: string,
    userId: string,
    orderId: string,
    dto: DeliverOrderDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.createDelivery(companyId, orderId, dto);
  }
}

export const salesOrderService = new SalesOrderService();
