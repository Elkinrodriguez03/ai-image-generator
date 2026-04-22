import { describe, it, expect } from "vitest";
import { PromptSchema, ASPECT_RATIOS, ASPECT_RATIO_DIMENSIONS } from "@/types/schema";

describe("PromptSchema", () => {
  it("accepts a minimal valid prompt and defaults aspectRatio to 1:1", () => {
    const result = PromptSchema.safeParse({ text: "hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aspectRatio).toBe("1:1");
      expect(result.data.text).toBe("hello world");
    }
  });

  it("rejects text shorter than 3 characters with a helpful message", () => {
    const result = PromptSchema.safeParse({ text: "hi" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Prompt too short");
    }
  });

  it("rejects text longer than 500 characters", () => {
    const result = PromptSchema.safeParse({ text: "a".repeat(501) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Prompt too long");
    }
  });

  it("rejects unknown aspect ratios", () => {
    const result = PromptSchema.safeParse({
      text: "valid prompt",
      aspectRatio: "21:9",
    });
    expect(result.success).toBe(false);
  });

  it.each(ASPECT_RATIOS)("accepts aspect ratio %s", (ratio) => {
    const result = PromptSchema.safeParse({ text: "valid prompt", aspectRatio: ratio });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aspectRatio).toBe(ratio);
    }
  });

  it("rejects non-string text (e.g. numbers)", () => {
    const result = PromptSchema.safeParse({ text: 123 });
    expect(result.success).toBe(false);
  });
});

describe("ASPECT_RATIO_DIMENSIONS", () => {
  it("defines dimensions for every supported aspect ratio", () => {
    for (const ratio of ASPECT_RATIOS) {
      const dims = ASPECT_RATIO_DIMENSIONS[ratio];
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    }
  });

  it("matches the requested ratio within a small tolerance", () => {
    const tolerance = 0.01;
    const expectedRatios: Record<(typeof ASPECT_RATIOS)[number], number> = {
      "1:1": 1,
      "16:9": 16 / 9,
      "4:3": 4 / 3,
    };
    for (const ratio of ASPECT_RATIOS) {
      const dims = ASPECT_RATIO_DIMENSIONS[ratio];
      const actual = dims.width / dims.height;
      expect(Math.abs(actual - expectedRatios[ratio])).toBeLessThan(tolerance);
    }
  });
});
