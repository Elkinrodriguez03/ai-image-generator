import { ASPECT_RATIO_DIMENSIONS } from "@/types/schema";
import type {
  GenerateImageOptions,
  IImageProvider,
  Result,
  GeneratedImage,
  ImageGenerationError,
} from "@/services/interfaces";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Pollinations AI free-tier provider.
 * Reference: https://image.pollinations.ai
 *
 * Usage: GET /prompt/{urlEncodedPrompt}?width=W&height=H&nologo=true&seed=N
 * The endpoint returns the generated image bytes directly; the same URL is
 * safe to embed in <img src>, so we return it as the canonical `url`.
 */
export class PollinationsProvider implements IImageProvider {
  public readonly providerName = "pollinations";

  public async generateImage(
    prompt: string,
    options: GenerateImageOptions,
  ): Promise<Result<GeneratedImage>> {
    const { width, height } = ASPECT_RATIO_DIMENSIONS[options.aspectRatio];
    const seed = Math.floor(Math.random() * 1_000_000);
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      nologo: "true",
      seed: String(seed),
    });
    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const externalSignal = options.signal;
    const onExternalAbort = (): void => controller.abort();
    externalSignal?.addEventListener("abort", onExternalAbort);

    try {
      // HEAD is not universally supported; use GET with streaming skipped.
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        return { ok: false, error: this.mapHttpStatus(response.status) };
      }

      // Drain the body so the connection closes cleanly; we only need the URL.
      await response.arrayBuffer();

      return {
        ok: true,
        value: {
          url,
          prompt,
          aspectRatio: options.aspectRatio,
          providerName: this.providerName,
        },
      };
    } catch (error: unknown) {
      return { ok: false, error: this.mapException(error) };
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    }
  }

  private mapHttpStatus(status: number): ImageGenerationError {
    if (status === 429) {
      return {
        code: "RATE_LIMITED",
        message: "The AI provider is rate-limiting requests. Please try again shortly.",
      };
    }
    if (status >= 500) {
      return {
        code: "PROVIDER_UNAVAILABLE",
        message: "The AI provider is currently unavailable.",
      };
    }
    return {
      code: "UNKNOWN",
      message: "The AI provider returned an unexpected response.",
    };
  }

  private mapException(error: unknown): ImageGenerationError {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        code: "TIMEOUT",
        message: "Image generation timed out. Please try again.",
      };
    }
    return {
      code: "PROVIDER_UNAVAILABLE",
      message: "Failed to reach the AI provider.",
    };
  }
}
