SRS: AI Image Generator (v1.0.0)
1. Project Context & Constraints
Goal: A scalable, maintainable AI Image Generator for learning purposes.

Tech Stack: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.

Deployment: Vercel.

AI Provider: Free Tier (Pollinations AI or Hugging Face Inference).

Principles: SOLID, Clean Architecture, Type Safety (Zod).

2. System Architecture (AI-Parseable)
The project must follow a Layered Architecture to satisfy Dependency Inversion.

Plaintext
src/
├── app/              # Presentation (Next.js Routes/Pages)
├── components/       # UI (shadcn/ui, Atomic Design)
├── lib/              # Infrastructure (External API clients)
├── services/         # Domain Logic (Interfaces & Service Implementations)
├── hooks/            # Logic reuse (TanStack Query)
└── types/            # Global Type Definitions & Zod Schemas
3. Functional Requirements (User Stories)
US-1: As a user, I can enter a text prompt to generate an image.

US-2: As a user, I see a "Skeleton" state while the AI is processing.

US-3: As a user, I receive a clear error message if the API rate limit is reached.

US-4: As a user, I can download the generated image directly.

4. Technical Specifications & SOLID Contracts
4.1 Interface Definition (Dependency Inversion)
AI should implement the IImageProvider interface to ensure the provider is swappable.

TypeScript
// @file: src/services/interfaces.ts
export interface IImageProvider {
  readonly providerName: string;
  generateImage(prompt: string): Promise<{ url: string; error?: string }>;
}
4.2 Data Validation (SRP)
All inputs must be validated using Zod before reaching the Service layer.

TypeScript
// @file: src/types/schema.ts
import { z } from 'zod';
export const PromptSchema = z.object({
  text: z.string().min(3, "Prompt too short").max(500, "Prompt too long"),
  aspectRatio: z.enum(['1:1', '16:9', '4:3']).default('1:1'),
});
5. Non-Functional "Rules for AI"
No "Any": TypeScript any type is strictly forbidden. Use unknown or defined interfaces.

Error Handling: Use a Result pattern or try/catch wrappers in the Service layer. Do not leak raw API errors to the UI.

Styling: Use Tailwind utility classes. Favor composition over complex CSS files.

State Management: Use useQuery from TanStack Query for server state; avoid global Redux or Context unless strictly necessary for UI state.