import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().min(2).max(120),
    description: z.string().max(2000).optional()
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).nullable().optional()
  })
  .strict();

export const addMemberSchema = z
  .object({
    email: z.string().email().max(255),
    role: z.enum(["admin", "member"]).optional()
  })
  .strict();

export const changeMemberRoleSchema = z
  .object({
    role: z.enum(["admin", "member"])
  })
  .strict();

