import {
  Prisma,
  PrismaClient,
  User,
  RefreshToken,
  AuthToken,
  VerificationToken,
  VerificationTokenType,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";
import { TransactionClient } from "../utils/transactionHandler";

export class UserRepository {
  private prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async create(
    data: Prisma.UserCreateInput,
    tx?: TransactionClient,
  ): Promise<User> {
    const client = tx || this.prisma;
    return client.user.create({ data });
  }

  public async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<User | null> {
    const client = tx || this.prisma;
    return client.user.findUnique({
      where: { id },
    });
  }

  public async findByEmail(
    email: string,
    tx?: TransactionClient,
  ): Promise<User | null> {
    const client = tx || this.prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  public async update(
    id: string,
    data: Prisma.UserUpdateInput,
    tx?: TransactionClient,
  ): Promise<User> {
    const client = tx || this.prisma;
    return client.user.update({
      where: { id },
      data,
    });
  }

  public async delete(
    id: string,
    tx?: TransactionClient,
  ): Promise<User> {
    const client = tx || this.prisma;
    return client.user.delete({
      where: { id },
    });
  }

  public async createRefreshToken(
    data: Prisma.RefreshTokenUncheckedCreateInput,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  public async findRefreshToken(
    tokenHash: string,
  ): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: {
        token: tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  public async updateRefreshToken(
    id: string,
    data: Prisma.RefreshTokenUpdateInput,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data,
    });
  }

  public async deleteRefreshToken(
    userId: string,
    tokenHash: string,
  ): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: tokenHash,
      },
    });
  }

  public async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  public async createAuthToken(
    data: Prisma.AuthTokenUncheckedCreateInput,
  ): Promise<AuthToken> {
    return this.prisma.authToken.create({
      data,
    });
  }

  public async findAuthToken(
    token: string,
  ): Promise<(AuthToken & { user: User }) | null> {
    return this.prisma.authToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  public async createVerificationToken(
    data: Prisma.VerificationTokenUncheckedCreateInput,
  ): Promise<VerificationToken> {
    return this.prisma.verificationToken.create({
      data,
    });
  }

  public async findVerificationToken(
    token: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken | null> {
    return this.prisma.verificationToken.findFirst({
      where: {
        token,
        type,
        expiresAt: { gt: new Date() },
      },
    });
  }

  public async deleteVerificationToken(id: string): Promise<void> {
    await this.prisma.verificationToken.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
