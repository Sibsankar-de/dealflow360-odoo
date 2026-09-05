import { z } from "zod";

export const registerUserSchema = z.object({
  userName: z
    .string({ required_error: "Username is required" })
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must not exceed 50 characters")
    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export const loginUserSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const updateUserSchema = z.object({
  userName: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must not exceed 50 characters")
    .trim()
    .optional(),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password must not exceed 100 characters"),
});

export type RegisterUserDTO = z.infer<typeof registerUserSchema>;
export type LoginUserDTO = z.infer<typeof loginUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type UpdatePasswordDTO = z.infer<typeof updatePasswordSchema>;
