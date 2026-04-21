import { describe, it, expect, vi } from "vitest";
import { ImageService } from "@/services/image-service";
import type { GeneratedImage, IImageProvider, Result } from "@/services/interfaces";

function createFakeProvider(response: Result<GeneratedImage>): IImageProvider & { calls: number } {
  const provider = {
    providerName: "fake",
    calls: 0,
    async generateImage(): Promise<Result<GeneratedImage>> {
      provider.calls += 1;
      return response;
    },
  };
  return provider;
}

describe("ImageService", () => {
  it("returns INVALID_INPUT without hitting the provider when text is too short", async () => {
    const provider = createFakeProvider({
      ok: true,
      value: {
        url: "https://example.com/image.jpg",
        prompt: "x",
        aspectRatio: "1:1",
        providerName: "fake",
      },
    });
    const service = new ImageService(provider);

    const result = await service.generate({ text: "hi" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_INPUT");
      expect(result.error.message).toBe("Prompt too short");
    }
    expect(provider.calls).toBe(0);
  });

  it("returns INVALID_INPUT when the payload is not an object", async () => {
    const provider = createFakeProvider({
      ok: true,
      value: {
        url: "https://example.com/image.jpg",
        prompt: "x",
        aspectRatio: "1:1",
        providerName: "fake",
      },
    });
    const service = new ImageService(provider);

    const result = await service.generate("nope");

    expect(result.ok).toBe(false);
    expect(provider.calls).toBe(0);
  });

  it("delegates to the provider when input is valid and applies the default aspect ratio", async () => {
    const provider: IImageProvider = {
      providerName: "fake",
      generateImage: vi.fn(async () => ({
        ok: true as const,
        value: {
          url: "https://example.com/image.jpg",
          prompt: "a cat",
          aspectRatio: "1:1" as const,
          providerName: "fake",
        },
      })),
    };
    const service = new ImageService(provider);

    const result = await service.generate({ text: "a cat" });

    expect(result.ok).toBe(true);
    expect(provider.generateImage).toHaveBeenCalledWith("a cat", {
      aspectRatio: "1:1",
      signal: undefined,
    });
  });

  it("forwards the aspect ratio and abort signal to the provider", async () => {
    const controller = new AbortController();
    const provider: IImageProvider = {
      providerName: "fake",
      generateImage: vi.fn(async () => ({
        ok: true as const,
        value: {
          url: "https://example.com/image.jpg",
          prompt: "mountains",
          aspectRatio: "16:9" as const,
          providerName: "fake",
        },
      })),
    };
    const service = new ImageService(provider);

    await service.generate({ text: "mountains", aspectRatio: "16:9" }, controller.signal);

    expect(provider.generateImage).toHaveBeenCalledWith("mountains", {
      aspectRatio: "16:9",
      signal: controller.signal,
    });
  });

  it("propagates provider errors unchanged (Result pattern)", async () => {
    const provider = createFakeProvider({
      ok: false,
      error: { code: "RATE_LIMITED", message: "slow down" },
    });
    const service = new ImageService(provider);

    const result = await service.generate({ text: "a valid prompt" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RATE_LIMITED");
      expect(result.error.message).toBe("slow down");
    }
    expect(provider.calls).toBe(1);
  });
});
