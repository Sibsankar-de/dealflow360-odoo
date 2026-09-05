import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Work email is required")
    .email("Please enter a valid email address")
    .trim(),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must not exceed 50 characters")
      .trim(),
    email: z
      .string()
      .min(1, "Work email is required")
      .email("Please enter a valid email address")
      .trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms and privacy policy"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
