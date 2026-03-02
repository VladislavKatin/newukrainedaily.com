import { z } from "zod";

export const rewriteOutputSchema = z.object({
  title: z.string().min(10).max(90),
  dek: z.string().min(10).max(220),
  summary: z.array(z.string().min(30).max(700)).min(2).max(4),
  keyPoints: z.array(z.string().min(10).max(220)).min(3).max(5),
  whyItMatters: z.array(z.string().min(30).max(500)).min(1).max(2),
  tags: z.array(z.string().min(2).max(32)).min(5).max(10),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  language: z.literal("en")
});

export type RewriteOutput = z.infer<typeof rewriteOutputSchema>;

