import { AuthProvider, User } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { env } from "../configs/env";
import {
  UserRepository,
  userRepository as defaultUserRepository,
} from "../repositories/user.repository";
import { JwtService, jwtService as defaultJwtService } from "./jwt.service";
import { ApiError } from "../utils/apiErrorHandler";
import {
  hashPassword,
  comparePassword,
  hashStringSha,
} from "../utils/hash-utils";
import { generateSecureToken } from "../utils/token-generator";
import { addDays } from "../utils/date-utils";
import {
  UserResponseDto,
  RegisterUserDto,
  LoginUserDto,
  UpdateUserDto,
  UpdatePasswordDto,
  toUserDto,
} from "../dto/user.dto";

export class AuthService {
  private userRepo: UserRepository;
  private jwt: JwtService;

  public constructor(
    userRepo: UserRepository = defaultUserRepository,
    jwt: JwtService = defaultJwtService,
  ) {
    this.userRepo = userRepo;
    this.jwt = jwt;
  }

  public async generateTokenPair(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwt.signAccessToken(user, 1);
    const refreshToken = generateSecureToken(128);
    const hashedRefreshToken = hashStringSha(refreshToken);

    await this.userRepo.createRefreshToken({
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: addDays(new Date(), env.REFRESH_TOKEN_EXPIRY),
    });

    return { accessToken, refreshToken };
  }

  public async register(
    dto: RegisterUserDto,
  ): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    const { userName, email, password } = dto;

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "User with this email already exists",
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.userRepo.create({
      userName,
      email,
      password: hashedPassword,
      authBy: AuthProvider.LOCAL,
      isEmailVerified: false,
    });

    const tokens = await this.generateTokenPair(user);

    return {
      user: toUserDto(user),
      ...tokens,
    };
  }

  public async login(
    dto: LoginUserDto,
  ): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = dto;

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const tokens = await this.generateTokenPair(user);

    return {
      user: toUserDto(user),
      ...tokens,
    };
  }

  public async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const hashedRefreshToken = hashStringSha(refreshToken);
      await this.userRepo.deleteRefreshToken(userId, hashedRefreshToken);
    }
  }

  public async refreshSession(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const hashedRefreshToken = hashStringSha(refreshToken);
    const tokenRecord =
      await this.userRepo.findRefreshToken(hashedRefreshToken);

    if (!tokenRecord) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Invalid or expired refresh token",
      );
    }

    const user = await this.userRepo.findById(tokenRecord.userId);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
    }

    const newAccessToken = this.jwt.signAccessToken(user, 1);
    const newRefreshToken = generateSecureToken(128);
    const newHashedRefreshToken = hashStringSha(newRefreshToken);

    // Rotate refresh token
    await this.userRepo.updateRefreshToken(tokenRecord.id, {
      token: newHashedRefreshToken,
      lastSeenAt: new Date(),
      expiresAt: addDays(new Date(), env.REFRESH_TOKEN_EXPIRY),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  public async verifyAuthToken(token: string): Promise<User> {
    const authToken = await this.userRepo.findAuthToken(token);

    if (!authToken || !authToken.active || authToken.expiresAt < new Date()) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Invalid or expired authorization token",
      );
    }

    return authToken.user;
  }

  public async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }
    return toUserDto(user);
  }

  public async updateUser(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const updated = await this.userRepo.update(userId, {
      ...(dto.userName ? { userName: dto.userName } : {}),
      ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
    });

    return toUserDto(updated);
  }

  public async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const isMatch = await comparePassword(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Current password does not match",
      );
    }

    const hashedPassword = await hashPassword(dto.newPassword);
    await this.userRepo.update(userId, {
      password: hashedPassword,
    });
  }
}

export const authService = new AuthService();
