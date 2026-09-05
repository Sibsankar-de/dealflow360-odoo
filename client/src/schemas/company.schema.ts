import { z } from "zod";

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .trim(),
  currency: z
    .string()
    .min(2, "Currency must be at least 2 characters")
    .max(10, "Currency must not exceed 10 characters")
    .trim()
    .default("USD"),
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must not exceed 100 characters")
    .trim(),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must not exceed 20 characters")
    .trim(),
  addressLine: z
    .string()
    .min(1, "Address line is required")
    .max(255, "Address line must not exceed 255 characters")
    .trim(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
