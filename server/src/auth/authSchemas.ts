import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(255),
    password: z.string().min(8).max(200),
    role: z.string().optional()
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(200)
  })
  .strict();

