import type { GeneratedImage, ImageGenerationError } from "@/services/interfaces";
import type { PromptInput } from "@/types/schema";

export class ApiError extends Error {
  public readonly code: ImageGenerationError["code"];

  public constructor(error: ImageGenerationError) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
  }
}

interface GenerateImageResponse {
  data?: GeneratedImage;
  error?: ImageGenerationError;
}

export async function generateImageRequest(
  input: PromptInput,
  signal?: AbortSignal,
): Promise<GeneratedImage> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  let payload: GenerateImageResponse;
  try {
    payload = (await response.json()) as GenerateImageResponse;
  } catch {
    throw new ApiError({
      code: "UNKNOWN",
      message: "Unexpected server response.",
    });
  }

  if (!response.ok || !payload.data) {
    throw new ApiError(
      payload.error ?? {
        code: "UNKNOWN",
        message: "Unexpected server response.",
      },
    );
  }

  return payload.data;
}
