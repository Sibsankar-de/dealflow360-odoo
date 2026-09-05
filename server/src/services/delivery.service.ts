import {
  Prisma,
  DeliveryStatus,
  BackorderStatus,
  SalesOrderStatus,
} from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import {
  DeliveryRepository,
  deliveryRepository as defaultDeliveryRepository,
} from "../repositories/delivery.repository";
import {
  SalesOrderRepository,
  salesOrderRepository as defaultSalesOrderRepository,
} from "../repositories/salesOrder.repository";
import {
  BackorderRepository,
  backorderRepository as defaultBackorderRepository,
} from "../repositories/backorder.repository";
import { ApiError } from "../utils/apiErrorHandler";
import {
  prismaTransaction,
  TransactionClient,
} from "../utils/transactionHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  DeliveryResponseDto,
  DeliveryFilterDto,
  toDeliveryDto,
} from "../dto/delivery.dto";
import { DeliverOrderDto } from "../dto/salesOrder.dto";
import { toBackorderDto, BackorderResponseDto } from "../dto/backorder.dto";

export class DeliveryService {
  private deliveryRepo: DeliveryRepository;
  private salesOrderRepo: SalesOrderRepository;
  private backorderRepo: BackorderRepository;

  public constructor(
    deliveryRepo: DeliveryRepository = defaultDeliveryRepository,
    salesOrderRepo: SalesOrderRepository = defaultSalesOrderRepository,
    backorderRepo: BackorderRepository = defaultBackorderRepository,
  ) {
    this.deliveryRepo = deliveryRepo;
    this.salesOrderRepo = salesOrderRepo;
    this.backorderRepo = backorderRepo;
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

  public async createDelivery(
    companyId: string,
    salesOrderId: string,
    dto: DeliverOrderDto,
  ): Promise<DeliveryResponseDto> {
    return prismaTransaction(async (tx: TransactionClient) => {
      const order = await this.salesOrderRepo.findByIdWithRelations(
        salesOrderId,
        companyId,
        tx,
      );

      if (!order) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Sales order not found");
      }

      if (order.status === SalesOrderStatus.CANCELLED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot deliver a cancelled sales order",
        );
      }

      if (order.status === SalesOrderStatus.DELIVERED) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Sales order is already fully delivered",
        );
      }

      const orderItemsMap = new Map(order.items.map((item) => [item.id, item]));

      for (const itemDto of dto.items) {
        const orderItem = orderItemsMap.get(itemDto.salesOrderItemId);
        if (!orderItem) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Sales order item ${itemDto.salesOrderItemId} does not belong to this order`,
          );
        }

        const currentDelivered = Number(orderItem.deliveredQuantity);
        const orderedQty = Number(orderItem.orderedQuantity);
        const remainingQty = orderedQty - currentDelivered;

        if (itemDto.deliveredQuantity <= 0) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Delivered quantity must be greater than 0",
          );
        }

        if (itemDto.deliveredQuantity > remainingQty) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Delivered quantity (${itemDto.deliveredQuantity}) exceeds remaining quantity (${remainingQty}) for product ${orderItem.productId}`,
          );
        }
      }

      const deliveredItemsMap = new Map(
        dto.items.map((item) => [item.salesOrderItemId, item.deliveredQuantity]),
      );

      const itemsWithRemaining: Array<{
        salesOrderItemId: string;
        productId: string;
        remainingQuantity: number;
      }> = [];

      for (const orderItem of order.items) {
        const deliveredNow = deliveredItemsMap.get(orderItem.id) || 0;
        const totalDelivered = Number(orderItem.deliveredQuantity) + deliveredNow;
        const remaining = Number(orderItem.orderedQuantity) - totalDelivered;

        if (remaining > 0) {
          itemsWithRemaining.push({
            salesOrderItemId: orderItem.id,
            productId: orderItem.productId,
            remainingQuantity: remaining,
          });
        }
      }

      let createdBackorderDto: BackorderResponseDto | null = null;
      if (itemsWithRemaining.length > 0) {
        const totalRemaining = itemsWithRemaining.reduce(
          (sum, i) => sum + i.remainingQuantity,
          0,
        );

        const backorderNo = await this.generateBackorderNo(tx);
        const expectedDate = dto.expectedDate ? new Date(dto.expectedDate) : null;

        const createdBackorder = await this.backorderRepo.create(
          {
            company: { connect: { id: companyId } },
            salesOrder: { connect: { id: salesOrderId } },
            backorderNo,
            parentBackorder: dto.backorderId
              ? { connect: { id: dto.backorderId } }
              : undefined,
            status: BackorderStatus.PENDING,
            expectedDate,
            totalQuantity: totalRemaining,
            fulfilledQuantity: 0,
            remainingQuantity: totalRemaining,
            notes: dto.notes,
            items: {
              create: itemsWithRemaining.map((item) => ({
                salesOrderItem: { connect: { id: item.salesOrderItemId } },
                product: { connect: { id: item.productId } },
                orderedQuantity: item.remainingQuantity,
                fulfilledQuantity: 0,
                remainingQuantity: item.remainingQuantity,
              })),
            },
          },
          tx,
        );

        const loadedBackorder = await this.backorderRepo.findByIdWithRelations(
          createdBackorder.id,
          companyId,
          tx,
        );
        if (loadedBackorder) {
          createdBackorderDto = toBackorderDto(loadedBackorder);
        }
      }

      if (dto.backorderId) {
        const existingBackorder = await this.backorderRepo.findByIdWithRelations(
          dto.backorderId,
          companyId,
          tx,
        );

        if (existingBackorder) {
          for (const itemDto of dto.items) {
            const boItem = existingBackorder.items.find(
              (i) => i.salesOrderItemId === itemDto.salesOrderItemId,
            );
            if (boItem) {
              const itemFulfilled = Number(boItem.fulfilledQuantity) + itemDto.deliveredQuantity;
              const itemRemaining = Math.max(
                0,
                Number(boItem.orderedQuantity) - itemFulfilled,
              );
              await this.backorderRepo.updateItem(
                boItem.id,
                {
                  fulfilledQuantity: itemFulfilled,
                  remainingQuantity: itemRemaining,
                },
                tx,
              );
            }
          }

          const deliveredNowTotal = dto.items.reduce(
            (sum, i) => sum + i.deliveredQuantity,
            0,
          );
          const newFulfilled =
            Number(existingBackorder.fulfilledQuantity) + deliveredNowTotal;
          const newRemaining = Math.max(
            0,
            Number(existingBackorder.totalQuantity) - newFulfilled,
          );

          await this.backorderRepo.update(
            existingBackorder.id,
            {
              fulfilledQuantity: newFulfilled,
              remainingQuantity: newRemaining,
              status:
                newRemaining <= 0
                  ? BackorderStatus.FULFILLED
                  : BackorderStatus.PARTIALLY_FULFILLED,
            },
            tx,
          );
        }
      }

      const deliveryNo = await this.generateDeliveryNo(tx);
      const delivery = await this.deliveryRepo.create(
        {
          company: { connect: { id: companyId } },
          salesOrder: { connect: { id: salesOrderId } },
          backorder: dto.backorderId
            ? { connect: { id: dto.backorderId } }
            : undefined,
          deliveryNo,
          status: DeliveryStatus.DELIVERED,
          trackingNumber: dto.trackingNumber,
          shippedAt: new Date(),
          deliveredAt: new Date(),
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => {
              const orderItem = orderItemsMap.get(item.salesOrderItemId)!;
              return {
                salesOrderItem: { connect: { id: item.salesOrderItemId } },
                product: { connect: { id: orderItem.productId } },
                deliveredQuantity: item.deliveredQuantity,
              };
            }),
          },
        },
        tx,
      );

      for (const itemDto of dto.items) {
        const orderItem = orderItemsMap.get(itemDto.salesOrderItemId)!;
        const newDelivered =
          Number(orderItem.deliveredQuantity) + itemDto.deliveredQuantity;
        await this.salesOrderRepo.updateItem(
          orderItem.id,
          {
            deliveredQuantity: newDelivered,
          },
          tx,
        );
      }

      const allItemsDelivered = itemsWithRemaining.length === 0;
      await this.salesOrderRepo.update(
        salesOrderId,
        {
          status: allItemsDelivered
            ? SalesOrderStatus.DELIVERED
            : SalesOrderStatus.PARTIALLY_DELIVERED,
        },
        tx,
      );

      const loadedDelivery = await this.deliveryRepo.findByIdWithRelations(
        delivery.id,
        companyId,
        tx,
      );

      return toDeliveryDto(loadedDelivery!, createdBackorderDto);
    });
  }

  public async getDeliveryById(
    deliveryId: string,
    companyId: string,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.deliveryRepo.findByIdWithRelations(
      deliveryId,
      companyId,
    );
    if (!delivery) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Delivery not found");
    }
    return toDeliveryDto(delivery);
  }

  public async listDeliveries(
    companyId: string,
    filters: DeliveryFilterDto,
  ): Promise<PaginatedResult<DeliveryResponseDto>> {
    const where: Prisma.DeliveryWhereInput = { companyId };

    if (filters.salesOrderId) {
      where.salesOrderId = filters.salesOrderId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { deliveryNo: { contains: filters.search, mode: "insensitive" } },
        { trackingNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const options = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    const paginated = await this.deliveryRepo.list(where, options);
    return {
      ...paginated,
      docs: paginated.docs.map((d) => toDeliveryDto(d)),
    };
  }
}

export const deliveryService = new DeliveryService();
