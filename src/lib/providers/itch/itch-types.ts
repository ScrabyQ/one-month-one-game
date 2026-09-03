import type { z } from "zod";
import {
  ItchEntriesResponseSchema,
  ItchEntrySchema,
} from "../../domain/schemas";

export type ItchEntriesResponse = z.infer<typeof ItchEntriesResponseSchema>;
export type ItchEntry = z.infer<typeof ItchEntrySchema>;
