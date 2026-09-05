import { z } from "zod";
import { CompanyStatus, CompanyUserRole } from "@prisma/client";

export const createCompanySchema = z.object({
  name: z
    .string({ required_error: "Company name is required" })
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .trim(),
  currency: z
    .string()
    .min(2, "Currency must be at least 2 characters")
    .max(10, "Currency must not exceed 10 characters")
    .trim()
    .default("USD")
    .optional(),
  country: z
    .string({ required_error: "Country is required" })
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must not exceed 100 characters")
    .trim(),
  postalCode: z
    .string({ required_error: "Postal code is required" })
    .min(1, "Postal code is required")
    .max(20, "Postal code must not exceed 20 characters")
    .trim(),
  addressLine: z
    .string({ required_error: "Address line is required" })
    .min(1, "Address line is required")
    .max(255, "Address line must not exceed 255 characters")
    .trim(),
});

export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .trim()
    .optional(),
  currency: z
    .string()
    .min(2, "Currency must be at least 2 characters")
    .max(10, "Currency must not exceed 10 characters")
    .trim()
    .optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must not exceed 100 characters")
    .trim()
    .optional(),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must not exceed 20 characters")
    .trim()
    .optional(),
  addressLine: z
    .string()
    .min(1, "Address line is required")
    .max(255, "Address line must not exceed 255 characters")
    .trim()
    .optional(),
});

export const addCompanyUserSchema = z.object({
  userEmail: z
    .string({ required_error: "User email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  role: z.nativeEnum(CompanyUserRole, {
    errorMap: () => ({ message: "Invalid company user role" }),
  }),
});

export const updateCompanyUserRoleSchema = z.object({
  userEmail: z
    .string({ required_error: "User email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  role: z.nativeEnum(CompanyUserRole, {
    errorMap: () => ({ message: "Invalid company user role" }),
  }),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type AddCompanyUserInput = z.infer<typeof addCompanyUserSchema>;
export type UpdateCompanyUserRoleInput = z.infer<typeof updateCompanyUserRoleSchema>;

