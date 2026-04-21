"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { generateImageRequest, ApiError } from "@/lib/api-client";
import type { GeneratedImage } from "@/services/interfaces";
import type { PromptInput } from "@/types/schema";

export type GenerateImageMutation = UseMutationResult<GeneratedImage, ApiError, PromptInput>;

export function useGenerateImage(): GenerateImageMutation {
  return useMutation<GeneratedImage, ApiError, PromptInput>({
    mutationKey: ["generate-image"],
    mutationFn: (input) => generateImageRequest(input),
  });
}
