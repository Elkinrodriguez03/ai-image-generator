"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptForm, type PromptFormValues } from "@/components/prompt-form";
import { ResultPanel } from "@/components/result-panel";
import { useGenerateImage } from "@/hooks/use-generate-image";
import type { AspectRatio } from "@/types/schema";

export function ImageGenerator() {
  const [lastAspectRatio, setLastAspectRatio] = useState<AspectRatio>("1:1");
  const mutation = useGenerateImage();

  const handleSubmit = (values: PromptFormValues): void => {
    setLastAspectRatio(values.aspectRatio);
    mutation.mutate(values);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Describe your image</CardTitle>
        </CardHeader>
        <CardContent>
          <PromptForm onSubmit={handleSubmit} isPending={mutation.isPending} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultPanel
            data={mutation.data}
            error={mutation.error}
            isPending={mutation.isPending}
            aspectRatio={lastAspectRatio}
          />
        </CardContent>
      </Card>
    </div>
  );
}
