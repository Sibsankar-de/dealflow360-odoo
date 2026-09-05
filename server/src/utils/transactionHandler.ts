import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type TransactionClient = Prisma.TransactionClient;

export async function prismaTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      return callback(tx);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10000,
      timeout: 20000,
    },
  );
}
