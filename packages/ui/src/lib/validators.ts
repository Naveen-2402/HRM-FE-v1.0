import { z } from "zod";

// 1. Email validation
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid work email address");

// 2. Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const ssoPasswordSchema = z
  .string()
  .min(1, "Password required")

// 3. Tenant/Company Name validation
export const tenantNameSchema = z
  .string()
  .min(2, "Company name must be at least 2 characters")
  .max(50, "Company name is too long");

/**
 * Helper function to parse Zod results for TanStack Form 
 * to prevent the [object Object] bug
 */
export const validateWith = (schema: z.ZodSchema) => (value: any) => {
  const result = schema.safeParse(value);
  return result?.success ? undefined : result?.error?.issues[0]?.message;
};