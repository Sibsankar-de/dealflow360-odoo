import { Prisma, InvoiceStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  InvoiceRepository,
  invoiceRepository as defaultInvoiceRepository,
} from "../repositories/invoice.repository";
import {
  SalesOrderRepository,
  salesOrderRepository as defaultSalesOrderRepository,
} from "../repositories/salesOrder.repository";
import {
  DeliveryRepository,
  deliveryRepository as defaultDeliveryRepository,
} from "../repositories/delivery.repository";
import { ApiError } from "../utils/apiErrorHandler";
import {
  prismaTransaction,
  TransactionClient,
} from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CreateInvoiceDto,
  RecordInvoicePaymentDto,
  InvoiceFilterDto,
  InvoiceResponseDto,
  toInvoiceDto,
} from "../dto/invoice.dto";

export class InvoiceService {
  private invoiceRepo: InvoiceRepository;
  private salesOrderRepo: SalesOrderRepository;
  private deliveryRepo: DeliveryRepository;

  public constructor(
    invoiceRepo: InvoiceRepository = defaultInvoiceRepository,
    salesOrderRepo: SalesOrderRepository = defaultSalesOrderRepository,
    deliveryRepo: DeliveryRepository = defaultDeliveryRepository,
  ) {
    this.invoiceRepo = invoiceRepo;
    this.salesOrderRepo = salesOrderRepo;
    this.deliveryRepo = deliveryRepo;
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

  public async createInvoice(
    companyId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      let salesOrderId = dto.salesOrderId;
      let customerId = "";
      let currency = "USD";
      const deliveryId: string | null = dto.deliveryId || null;

      interface PreparedInvoiceItem {
        salesOrderItemId: string;
        productId: string;
        deliveredQuantity: number;
        unitPrice: number;
        discount: number;
        tax: number;
        lineTotal: number;
      }

      const preparedItems: PreparedInvoiceItem[] = [];

      if (dto.deliveryId) {
        const delivery = await this.deliveryRepo.findByIdWithRelations(
          dto.deliveryId,
          companyId,
          tx,
        );

        if (!delivery) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Delivery not found");
        }

        salesOrderId = delivery.salesOrderId;
        const salesOrder = await this.salesOrderRepo.findByIdWithRelations(
          salesOrderId,
          companyId,
          tx,
        );

        if (!salesOrder) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Sales order not found");
        }

        customerId = salesOrder.customerId;
        currency = salesOrder.currency;

        const orderItemsMap = new Map(
          salesOrder.items.map((item) => [item.id, item]),
        );

        for (const delItem of delivery.items) {
          if (!delItem.salesOrderItemId) {
            continue;
          }
          const orderItem = orderItemsMap.get(delItem.salesOrderItemId);
          if (!orderItem) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              `Sales order item ${delItem.salesOrderItemId} not found in order`,
            );
          }

          const deliveredQty = Number(delItem.deliveredQuantity);
          const alreadyDelivered = Number(orderItem.deliveredQuantity);
          const alreadyInvoiced = Number(orderItem.invoicedQuantity);
          const maxInvoicable = Math.max(0, alreadyDelivered - alreadyInvoiced);

          if (deliveredQty <= 0) {
            continue;
          }

          if (deliveredQty > maxInvoicable) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              `Delivered quantity (${deliveredQty}) has already been invoiced for product ${delItem.productId}. Invoices only include quantities actually delivered.`,
            );
          }

          const unitPrice = Number(orderItem.unitPrice);
          const orderedQty = Number(orderItem.orderedQuantity);
          const discountRatio = orderedQty > 0 ? deliveredQty / orderedQty : 0;
          const itemDiscount = Number(
            (Number(orderItem.discount) * discountRatio).toFixed(2),
          );
          const taxableAmount = unitPrice * deliveredQty - itemDiscount;
          const taxRate = Number(orderItem.taxRate);
          const itemTax = Number(
            ((taxableAmount * taxRate) / 100).toFixed(2),
          );
          const lineTotal = Number(
            (taxableAmount + itemTax).toFixed(2),
          );

          preparedItems.push({
            salesOrderItemId: orderItem.id,
            productId: orderItem.productId,
            deliveredQuantity: deliveredQty,
            unitPrice,
            discount: itemDiscount,
            tax: itemTax,
            lineTotal,
          });
        }
      } else if (salesOrderId) {
        const salesOrder = await this.salesOrderRepo.findByIdWithRelations(
          salesOrderId,
          companyId,
          tx,
        );

        if (!salesOrder) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Sales order not found");
        }

        customerId = salesOrder.customerId;
        currency = salesOrder.currency;

        const orderItemsMap = new Map(
          salesOrder.items.map((item) => [item.id, item]),
        );

        if (dto.items && dto.items.length > 0) {
          for (const itemInput of dto.items) {
            const orderItem = orderItemsMap.get(itemInput.salesOrderItemId);
            if (!orderItem) {
              throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Sales order item ${itemInput.salesOrderItemId} not found in order`,
              );
            }

            const deliveredQty = itemInput.deliveredQuantity;
            const alreadyDelivered = Number(orderItem.deliveredQuantity);
            const alreadyInvoiced = Number(orderItem.invoicedQuantity);
            const maxInvoicable = Math.max(0, alreadyDelivered - alreadyInvoiced);

            if (deliveredQty <= 0) {
              throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Delivered quantity must be greater than 0",
              );
            }

            if (deliveredQty > maxInvoicable) {
              throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Cannot invoice ${deliveredQty} units for product ${orderItem.productId}. Only ${maxInvoicable} delivered units are uninvoiced. Invoices only include quantities actually delivered.`,
              );
            }

            const unitPrice = Number(orderItem.unitPrice);
            const orderedQty = Number(orderItem.orderedQuantity);
            const discountRatio = orderedQty > 0 ? deliveredQty / orderedQty : 0;
            const itemDiscount = Number(
              (Number(orderItem.discount) * discountRatio).toFixed(2),
            );
            const taxableAmount = unitPrice * deliveredQty - itemDiscount;
            const taxRate = Number(orderItem.taxRate);
            const itemTax = Number(
              ((taxableAmount * taxRate) / 100).toFixed(2),
            );
            const lineTotal = Number(
              (taxableAmount + itemTax).toFixed(2),
            );

            preparedItems.push({
              salesOrderItemId: orderItem.id,
              productId: orderItem.productId,
              deliveredQuantity: deliveredQty,
              unitPrice,
              discount: itemDiscount,
              tax: itemTax,
              lineTotal,
            });
          }
        } else {
          for (const orderItem of salesOrder.items) {
            const alreadyDelivered = Number(orderItem.deliveredQuantity);
            const alreadyInvoiced = Number(orderItem.invoicedQuantity);
            const invoicableQty = Math.max(0, alreadyDelivered - alreadyInvoiced);

            if (invoicableQty > 0) {
              const unitPrice = Number(orderItem.unitPrice);
              const orderedQty = Number(orderItem.orderedQuantity);
              const discountRatio = orderedQty > 0 ? invoicableQty / orderedQty : 0;
              const itemDiscount = Number(
                (Number(orderItem.discount) * discountRatio).toFixed(2),
              );
              const taxableAmount = unitPrice * invoicableQty - itemDiscount;
              const taxRate = Number(orderItem.taxRate);
              const itemTax = Number(
                ((taxableAmount * taxRate) / 100).toFixed(2),
              );
              const lineTotal = Number(
                (taxableAmount + itemTax).toFixed(2),
              );

              preparedItems.push({
                salesOrderItemId: orderItem.id,
                productId: orderItem.productId,
                deliveredQuantity: invoicableQty,
                unitPrice,
                discount: itemDiscount,
                tax: itemTax,
                lineTotal,
              });
            }
          }
        }
      }

      if (preparedItems.length === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "No delivered quantities available to invoice. Invoices only include quantities actually delivered.",
        );
      }

      const subtotal = Number(
        preparedItems
          .reduce(
            (sum, item) => sum + item.unitPrice * item.deliveredQuantity,
            0,
          )
          .toFixed(2),
      );
      const discount = Number(
        preparedItems.reduce((sum, item) => sum + item.discount, 0).toFixed(2),
      );
      const tax = Number(
        preparedItems.reduce((sum, item) => sum + item.tax, 0).toFixed(2),
      );
      const total = Number((subtotal - discount + tax).toFixed(2));
      const paidAmount = 0;
      const remainingAmount = total;

      const invoiceNo = await this.generateInvoiceNo(tx);
      const issueDate = new Date();
      const dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const createdInvoice = await this.invoiceRepo.create(
        {
          company: { connect: { id: companyId } },
          salesOrder: { connect: { id: salesOrderId } },
          customer: { connect: { id: customerId } },
          delivery: deliveryId ? { connect: { id: deliveryId } } : undefined,
          invoiceNo,
          status: InvoiceStatus.POSTED,
          issueDate,
          dueDate,
          currency,
          paymentTerms: dto.paymentTerms || "Net 30",
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          remainingAmount,
          notes: dto.notes,
          items: {
            create: preparedItems.map((item) => ({
              salesOrderItem: { connect: { id: item.salesOrderItemId } },
              product: { connect: { id: item.productId } },
              deliveredQuantity: item.deliveredQuantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              tax: item.tax,
              lineTotal: item.lineTotal,
            })),
          },
        },
        tx,
      );

      for (const item of preparedItems) {
        const currentItem = await tx.salesOrderItem.findUnique({
          where: { id: item.salesOrderItemId },
        });
        if (currentItem) {
          const newInvoiced =
            Number(currentItem.invoicedQuantity) + item.deliveredQuantity;
          await this.salesOrderRepo.updateItem(
            item.salesOrderItemId,
            {
              invoicedQuantity: newInvoiced,
            },
            tx,
          );
        }
      }

      const loadedInvoice = await this.invoiceRepo.findByIdWithRelations(
        createdInvoice.id,
        companyId,
        tx,
      );

      return toInvoiceDto(loadedInvoice!);
    });
  }

  public async recordPayment(
    companyId: string,
    invoiceId: string,
    dto: RecordInvoicePaymentDto,
  ): Promise<InvoiceResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const invoice = await this.invoiceRepo.findByIdWithRelations(
        invoiceId,
        companyId,
        tx,
      );

      if (!invoice) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found");
      }

      if (
        invoice.status === InvoiceStatus.PAID ||
        Number(invoice.remainingAmount) <= 0
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Invoice is already fully paid",
        );
      }

      if (
        invoice.status === InvoiceStatus.CANCELLED ||
        invoice.status === InvoiceStatus.VOID
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot record payment on a cancelled or void invoice",
        );
      }

      if (dto.amount <= 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Payment amount must be greater than 0",
        );
      }

      const currentRemaining = Number(invoice.remainingAmount);
      if (dto.amount > currentRemaining) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Payment amount (${dto.amount}) exceeds remaining amount (${currentRemaining})`,
        );
      }

      const newPaid = Number(
        (Number(invoice.paidAmount) + dto.amount).toFixed(2),
      );
      const newRemaining = Number(
        Math.max(0, Number(invoice.total) - newPaid).toFixed(2),
      );
      const isPaid = newRemaining <= 0;

      await this.invoiceRepo.update(
        invoiceId,
        {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
          paidAt: isPaid ? new Date() : invoice.paidAt,
          notes: dto.notes ? `${invoice.notes ? `${invoice.notes}\n` : ""}${dto.notes}` : invoice.notes,
        },
        tx,
      );

      const updatedInvoice = await this.invoiceRepo.findByIdWithRelations(
        invoiceId,
        companyId,
        tx,
      );

      return toInvoiceDto(updatedInvoice!);
    });
  }

  public async getInvoiceById(
    invoiceId: string,
    companyId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepo.findByIdWithRelations(
      invoiceId,
      companyId,
    );
    if (!invoice) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found");
    }
    return toInvoiceDto(invoice);
  }

  public async listInvoices(
    companyId: string,
    filters: InvoiceFilterDto,
  ): Promise<PaginatedResult<InvoiceResponseDto>> {
    const where: Prisma.InvoiceWhereInput = { companyId };

    if (filters.salesOrderId) {
      where.salesOrderId = filters.salesOrderId;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { invoiceNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const options = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    const paginated = await this.invoiceRepo.list(where, options);
    return {
      ...paginated,
      docs: paginated.docs.map((inv) => toInvoiceDto(inv)),
    };
  }
}

export const invoiceService = new InvoiceService();
