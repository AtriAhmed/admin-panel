import { z } from "zod";

export const DeleteRecordResultSchema = z.object({
  id: z.string(),
});

export type DeleteRecordResult = z.infer<typeof DeleteRecordResultSchema>;
