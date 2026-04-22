import { NextResponse, type NextRequest } from "next/server";
import { createDefaultImageService } from "@/services/image-service";
import type { ImageGenerationErrorCode } from "@/services/interfaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_STATUS: Record<ImageGenerationErrorCode, number> = {
  INVALID_INPUT: 400,
  RATE_LIMITED: 429,
  PROVIDER_UNAVAILABLE: 502,
  TIMEOUT: 504,
  UNKNOWN: 500,
};

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const service = createDefaultImageService();
  const result = await service.generate(body, request.signal);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error.code] });
  }

  return NextResponse.json({ data: result.value }, { status: 200 });
}
