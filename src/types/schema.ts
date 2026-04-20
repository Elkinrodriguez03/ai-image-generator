import { z } from "zod";

export const ASPECT_RATIOS = ["1:1", "16:9", "4:3"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const PromptSchema = z.object({
  text: z.string().min(3, "Prompt too short").max(500, "Prompt too long"),
  aspectRatio: z.enum(ASPECT_RATIOS).default("1:1"),
});

export type PromptInput = z.infer<typeof PromptSchema>;

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "4:3": { width: 1024, height: 768 },
};
