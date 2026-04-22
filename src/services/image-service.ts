import { PromptSchema, type PromptInput } from "@/types/schema";
import { PollinationsProvider } from "@/lib/pollinations-provider";
import type {
  GeneratedImage,
  IImageProvider,
  ImageGenerationError,
  Result,
} from "@/services/interfaces";

/**
 * Orchestrates input validation + provider invocation.
 * Depends on the IImageProvider abstraction (DIP).
 */
export class ImageService {
  public constructor(private readonly provider: IImageProvider) {}

  public async generate(rawInput: unknown, signal?: AbortSignal): Promise<Result<GeneratedImage>> {
    const parsed = PromptSchema.safeParse(rawInput);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const error: ImageGenerationError = {
        code: "INVALID_INPUT",
        message: first?.message ?? "Invalid input.",
      };
      return { ok: false, error };
    }

    const input: PromptInput = parsed.data;
    return this.provider.generateImage(input.text, {
      aspectRatio: input.aspectRatio,
      signal,
    });
  }
}

/**
 * Default service composition. Swap the provider here to change backends.
 */
export function createDefaultImageService(): ImageService {
  return new ImageService(new PollinationsProvider());
}
