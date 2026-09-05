import { z } from "zod";
import { User, AuthProvider, UserRole } from "@prisma/client";
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from "../schemas/user.schema";

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
export type LoginUserDto = z.infer<typeof loginUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;

export interface UserResponseDto {
  id: string;
  userName: string;
  email: string;
  avatar: string | null;
  authBy: AuthProvider;
  isEmailVerified: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken?: string;
  refreshToken?: string;
}

export const toUserDto = (user: User): UserResponseDto => {
  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    avatar: user.avatar,
    authBy: user.authBy,
    isEmailVerified: user.isEmailVerified,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
