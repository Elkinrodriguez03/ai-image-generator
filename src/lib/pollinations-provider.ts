import { ASPECT_RATIO_DIMENSIONS } from "@/types/schema";
import { getServerEnv } from "@/lib/env";
import type {
  GenerateImageOptions,
  IImageProvider,
  Result,
  GeneratedImage,
  ImageGenerationError,
} from "@/services/interfaces";

interface PollinationsConfig {
  baseUrl: string;
  timeoutMs: number;
}

const FALLBACK_CONFIG: PollinationsConfig = {
  baseUrl: "https://image.pollinations.ai/prompt",
  timeoutMs: 30_000,
};

function safeGetEnv(): PollinationsConfig {
  try {
    const env = getServerEnv();
    return {
      baseUrl: env.POLLINATIONS_BASE_URL,
      timeoutMs: env.POLLINATIONS_TIMEOUT_MS,
    };
  } catch {
    // In unit tests or misconfigured dev environments we still want a usable
    // provider; production will have validated env at boot time.
    return FALLBACK_CONFIG;
  }
}

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
  private readonly config: PollinationsConfig;

  public constructor(config?: Partial<PollinationsConfig>) {
    const env = safeGetEnv();
    this.config = {
      baseUrl: config?.baseUrl ?? env.baseUrl,
      timeoutMs: config?.timeoutMs ?? env.timeoutMs,
    };
  }

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
    const url = `${this.config.baseUrl}/${encodeURIComponent(prompt)}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
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
