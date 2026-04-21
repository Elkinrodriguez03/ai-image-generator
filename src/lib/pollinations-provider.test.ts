import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PollinationsProvider } from "@/lib/pollinations-provider";

const originalFetch = globalThis.fetch;

function mockFetchResponse(status: number): void {
  globalThis.fetch = vi.fn(
    async () => new Response(new ArrayBuffer(8), { status }),
  ) as unknown as typeof fetch;
}

function mockFetchThrows(error: unknown): void {
  globalThis.fetch = vi.fn(async () => {
    throw error;
  }) as unknown as typeof fetch;
}

describe("PollinationsProvider", () => {
  beforeEach(() => {
    // Restore fresh state before each test.
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns a successful Result with encoded URL, dimensions and provider name on 200", async () => {
    mockFetchResponse(200);
    const provider = new PollinationsProvider();

    const result = await provider.generateImage("hello world", { aspectRatio: "16:9" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.providerName).toBe("pollinations");
      expect(result.value.prompt).toBe("hello world");
      expect(result.value.aspectRatio).toBe("16:9");
      expect(result.value.url).toContain("hello%20world");
      expect(result.value.url).toContain("width=1280");
      expect(result.value.url).toContain("height=720");
      expect(result.value.url).toContain("nologo=true");
    }
  });

  it("maps HTTP 429 to RATE_LIMITED", async () => {
    mockFetchResponse(429);
    const provider = new PollinationsProvider();

    const result = await provider.generateImage("foo", { aspectRatio: "1:1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
  });

  it("maps HTTP 5xx to PROVIDER_UNAVAILABLE", async () => {
    mockFetchResponse(503);
    const provider = new PollinationsProvider();

    const result = await provider.generateImage("foo", { aspectRatio: "1:1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("maps unexpected HTTP status (e.g. 418) to UNKNOWN", async () => {
    mockFetchResponse(418);
    const provider = new PollinationsProvider();

    const result = await provider.generateImage("foo", { aspectRatio: "1:1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNKNOWN");
  });

  it("maps AbortError exceptions to TIMEOUT", async () => {
    mockFetchThrows(new DOMException("aborted", "AbortError"));
    const provider = new PollinationsProvider();

    const result = await provider.generateImage("foo", { aspectRatio: "1:1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TIMEOUT");
  });

  it("maps generic network errors to PROVIDER_UNAVAILABLE", async () => {
    mockFetchThrows(new TypeError("network down"));
    const provider = new PollinationsProvider();

    const result = await provider.generateImage("foo", { aspectRatio: "1:1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("honours an external AbortSignal and returns TIMEOUT when aborted mid-flight", async () => {
    const controller = new AbortController();
    globalThis.fetch = vi.fn((_input, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;

    const provider = new PollinationsProvider();
    const promise = provider.generateImage("foo", {
      aspectRatio: "1:1",
      signal: controller.signal,
    });
    controller.abort();
    const result = await promise;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TIMEOUT");
  });
});
