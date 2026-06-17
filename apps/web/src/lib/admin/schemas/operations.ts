import { z } from "zod";

export const OperationRequestSchema = z.object({
  id: z.string(),
  owner: z.string(),
  slug: z.string(),
  summary: z.string(),
  title: z.string(),
  status: z.enum(["draft", "published"]),
  updatedAt: z.string(),
});

export const OperationRequestsSchema = z.array(OperationRequestSchema);

export const CreateOperationRequestSchema = z.object({
  owner: z.string().trim().min(2, {
    message: "Owner must be at least 2 characters.",
  }),
  slug: z
    .string()
    .trim()
    .min(2, {
      message: "Slug must be at least 2 characters.",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug may only contain lowercase letters, numbers, and hyphens.",
    }),
  summary: z.string().trim().min(8, {
    message: "Summary must be at least 8 characters.",
  }),
  title: z.string().trim().min(2, {
    message: "Title must be at least 2 characters.",
  }),
});

export const UpdateOperationRequestSchema = CreateOperationRequestSchema.extend({
  status: OperationRequestSchema.shape.status,
});

export type OperationRequest = z.infer<typeof OperationRequestSchema>;
export type CreateOperationRequest = z.infer<typeof CreateOperationRequestSchema>;
export type UpdateOperationRequest = z.infer<typeof UpdateOperationRequestSchema>;
