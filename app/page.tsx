import { ImageGenerator } from "@/components/image-generator";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AI Image Generator</h1>
        <p className="text-muted-foreground max-w-2xl">
          Describe what you want to see and generate an image using a free-tier AI provider.
        </p>
      </header>
      <ImageGenerator />
    </main>
  );
}
