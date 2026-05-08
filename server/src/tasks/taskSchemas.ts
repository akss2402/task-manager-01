import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z
  .object({
    title: z.string().min(2).max(200),
    description: z.string().max(5000).optional(),
    status: taskStatusSchema.optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assigneeId: uuidSchema.nullable().optional(),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assigneeId: uuidSchema.nullable().optional(),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
  })
  .strict();

export const taskListQuerySchema = z
  .object({
    status: taskStatusSchema.optional(),
    assigneeId: uuidSchema.optional(),
    dueBefore: z.string().datetime({ offset: true }).optional(),
    dueAfter: z.string().datetime({ offset: true }).optional(),
    q: z.string().min(1).max(200).optional()
  })
  .strict();

export const taskParamsSchema = z
  .object({
    projectId: uuidSchema,
    taskId: uuidSchema
  })
  .strict();

