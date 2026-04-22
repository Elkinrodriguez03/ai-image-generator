"use client";

import { useState, type FormEvent } from "react";
import { Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PromptSchema, ASPECT_RATIOS, type AspectRatio } from "@/types/schema";

const ASPECT_RATIO_HINTS: Record<AspectRatio, string> = {
  "1:1": "Square — great for avatars, icons, and social posts.",
  "16:9": "Widescreen — ideal for desktop wallpapers, banners, and video thumbnails.",
  "4:3": "Classic — works well for photos, slides, and print-style layouts.",
};

export interface PromptFormValues {
  text: string;
  aspectRatio: AspectRatio;
}

interface PromptFormProps {
  onSubmit: (values: PromptFormValues) => void;
  isPending: boolean;
}

export function PromptForm({ onSubmit, isPending }: PromptFormProps) {
  const [text, setText] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const parsed = PromptSchema.safeParse({ text, aspectRatio });
    if (!parsed.success) {
      setClientError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setClientError(null);
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          name="prompt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A cozy cabin in a snowy pine forest at dusk, cinematic lighting"
          rows={4}
          disabled={isPending}
          aria-invalid={clientError ? true : undefined}
          className="resize-none"
        />
        <p className="text-muted-foreground text-xs">
          Between 3 and 500 characters. {text.length}/500
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="aspect-ratio">Aspect ratio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="What is aspect ratio?"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-4 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Info className="size-4" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-72 text-sm">
              <p className="font-medium">Aspect ratio</p>
              <p className="text-muted-foreground mt-1">
                The width-to-height proportion of the generated image. Pick the shape that best fits
                where you&apos;ll use it.
              </p>
              <ul className="mt-3 space-y-1.5">
                {ASPECT_RATIOS.map((ratio) => (
                  <li key={ratio} className="flex gap-2">
                    <span className="font-mono text-xs font-semibold">{ratio}</span>
                    <span className="text-muted-foreground">{ASPECT_RATIO_HINTS[ratio]}</span>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </div>
        <Select
          value={aspectRatio}
          onValueChange={(value) => setAspectRatio(value as AspectRatio)}
          disabled={isPending}
        >
          <SelectTrigger id="aspect-ratio">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map((ratio) => (
              <SelectItem key={ratio} value={ratio}>
                {ratio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clientError ? (
        <p role="alert" className="text-destructive text-sm">
          {clientError}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={isPending} className="gap-2">
          <Sparkles className="size-4" aria-hidden />
          {isPending ? "Generating..." : "Generate image"}
        </Button>
      </div>
    </form>
  );
}
