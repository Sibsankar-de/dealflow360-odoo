import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiErrorHandler";
import { TransactionClient } from "../utils/transactionHandler";

export interface WarehouseStockSplit {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface StockDeductionResult {
  productId: string;
  warehouseId: string;
  warehouseName: string;
  productName: string;
  deductedQuantity: number;
  remainingStock: number;
}

export class StockService {
  public async deductStockSplits(
    companyId: string,
    splits: WarehouseStockSplit[],
    tx: TransactionClient,
    options: { allowNegativeStock?: boolean } = {},
  ): Promise<StockDeductionResult[]> {
    if (!splits || splits.length === 0) {
      return [];
    }

    // Filter out zero or negative quantities
    const validSplits = splits.filter((s) => s.quantity > 0);
    if (validSplits.length === 0) {
      return [];
    }

    // Process all warehouse stock deductions concurrently in the single transaction
    const results = await Promise.all(
      validSplits.map(async (split): Promise<StockDeductionResult> => {
        const { productId, warehouseId, quantity } = split;

        // Fetch warehouse and product information in parallel
        const [warehouse, product, stockRecord] = await Promise.all([
          tx.warehouse.findFirst({
            where: { id: warehouseId, companyId },
          }),
          tx.product.findFirst({
            where: { id: productId, companyId },
          }),
          tx.productStock.findUnique({
            where: {
              productId_warehouseId: { productId, warehouseId },
            },
          }),
        ]);

        if (!warehouse) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            `Warehouse with ID ${warehouseId} not found in this company`,
          );
        }

        if (!product) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            `Product with ID ${productId} not found in this company`,
          );
        }

        const availableStock = stockRecord ? Number(stockRecord.stockQty) : 0;
        if (!options.allowNegativeStock && availableStock < quantity) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Insufficient stock for product "${product.name}" in warehouse "${warehouse.name}". Available: ${availableStock}, Requested: ${quantity}`,
          );
        }

        const newStockQty = Number((availableStock - quantity).toFixed(4));

        let updatedStock;
        if (stockRecord) {
          updatedStock = await tx.productStock.update({
            where: { id: stockRecord.id },
            data: { stockQty: new Prisma.Decimal(newStockQty) },
          });
        } else {
          updatedStock = await tx.productStock.create({
            data: {
              productId,
              warehouseId,
              stockQty: new Prisma.Decimal(newStockQty),
            },
          });
        }

        return {
          productId,
          warehouseId,
          warehouseName: warehouse.name,
          productName: product.name,
          deductedQuantity: quantity,
          remainingStock: Number(updatedStock.stockQty),
        };
      }),
    );

    return results;
  }

  public async validateStockSplits(
    splits: WarehouseStockSplit[],
    tx: TransactionClient,
  ): Promise<
    Array<{
      productId: string;
      warehouseId: string;
      availableStock: number;
      requestedQuantity: number;
      isSufficient: boolean;
    }>
  > {
    return Promise.all(
      splits.map(async (split) => {
        const stockRecord = await tx.productStock.findUnique({
          where: {
            productId_warehouseId: {
              productId: split.productId,
              warehouseId: split.warehouseId,
            },
          },
        });
        const availableStock = stockRecord ? Number(stockRecord.stockQty) : 0;
        return {
          productId: split.productId,
          warehouseId: split.warehouseId,
          availableStock,
          requestedQuantity: split.quantity,
          isSufficient: availableStock >= split.quantity,
        };
      }),
    );
  }
}

export const stockService = new StockService();
