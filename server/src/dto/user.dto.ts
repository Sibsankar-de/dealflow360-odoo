import { User, AuthProvider, UserRole } from "@prisma/client";

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

export interface RegisterUserDto {
  userName: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  userName?: string;
  avatar?: string | null;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
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
