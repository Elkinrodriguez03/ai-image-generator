"use client";

import { AlertCircle, Download, ImageIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api-client";
import type { GeneratedImage } from "@/services/interfaces";
import type { AspectRatio } from "@/types/schema";
import { ASPECT_RATIO_DIMENSIONS } from "@/types/schema";

interface ResultPanelProps {
  data: GeneratedImage | undefined;
  error: ApiError | null;
  isPending: boolean;
  aspectRatio: AspectRatio;
}

const ERROR_TITLES: Record<ApiError["code"], string> = {
  RATE_LIMITED: "Rate limit reached",
  INVALID_INPUT: "Invalid prompt",
  PROVIDER_UNAVAILABLE: "AI provider unavailable",
  TIMEOUT: "Request timed out",
  UNKNOWN: "Something went wrong",
};

export function ResultPanel({ data, error, isPending, aspectRatio }: ResultPanelProps) {
  const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  const aspectStyle = { aspectRatio: `${dims.width} / ${dims.height}` };

  const handleDownload = async (image: GeneratedImage): Promise<void> => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = buildFilename(image);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch {
      // Fallback: open in new tab if the download cannot be triggered.
      window.open(image.url, "_blank", "noopener,noreferrer");
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-full rounded-lg" style={aspectStyle} />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="size-4" aria-hidden />
        <AlertTitle>{ERROR_TITLES[error.code]}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div
        className="text-muted-foreground flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed"
        style={aspectStyle}
      >
        <ImageIcon className="size-10" aria-hidden />
        <p className="text-sm">Your generated image will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.url}
        alt={data.prompt}
        width={dims.width}
        height={dims.height}
        className="bg-muted w-full rounded-lg border object-cover"
        style={aspectStyle}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void handleDownload(data)} className="gap-2">
          <Download className="size-4" aria-hidden />
          Download
        </Button>
        <span className="text-muted-foreground text-xs">
          {dims.width}×{dims.height} · {data.providerName}
        </span>
      </div>
    </div>
  );
}

function buildFilename(image: GeneratedImage): string {
  const slug = image.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "generated"}-${Date.now()}.jpg`;
}
