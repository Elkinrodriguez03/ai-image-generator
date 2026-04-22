import type { AspectRatio } from "@/types/schema";

/**
 * Domain-level error codes. UI maps these to user-facing messages.
 * Raw provider errors MUST be mapped to one of these values in the Service layer.
 */
export type ImageGenerationErrorCode =
  | "RATE_LIMITED"
  | "INVALID_INPUT"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

export interface ImageGenerationError {
  code: ImageGenerationErrorCode;
  message: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  providerName: string;
}

/**
 * Result pattern. Prefer this over throwing in the service layer.
 */
export type Result<T, E = ImageGenerationError> = { ok: true; value: T } | { ok: false; error: E };

export interface GenerateImageOptions {
  aspectRatio: AspectRatio;
  signal?: AbortSignal;
}

/**
 * Dependency Inversion seam for AI providers.
 * Keep this tiny so multiple providers (Pollinations, HuggingFace, etc.) can implement it.
 */
export interface IImageProvider {
  readonly providerName: string;
  generateImage(prompt: string, options: GenerateImageOptions): Promise<Result<GeneratedImage>>;
}
