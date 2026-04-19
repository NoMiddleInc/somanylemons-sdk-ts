/**
 * Tests for the TypeScript SDK — mirrors the Python SDK test coverage.
 *
 * Uses vitest + global fetch mocking (no external deps like msw).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SMLClient,
  SMLError,
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  QuotaError,
  ServerError,
} from "../src/index.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown, headers?: Record<string, string>) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => headers?.[key] ?? null,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response);
}

function makeClient(): SMLClient {
  return new SMLClient({
    apiKey: "sml_test_key_1234567890",
    baseUrl: "https://api.test.somanylemons.com",
  });
}

// ── Setup ───────────────────────────────────────────────────────────────────

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ── Functional tests ────────────────────────────────────────────────────────

describe("jobs.list()", () => {
  it("parses compact response", async () => {
    globalThis.fetch = mockFetch(200, {
      jobs: [
        {
          id: "42",
          title: "Test recording",
          status: "completed",
          source: "api",
          clip_count: 3,
          transcript_preview: "hello...",
          created_at: "2026-04-15",
        },
      ],
    });

    const client = makeClient();
    const jobs = await client.jobs.list({ limit: 10 });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("42");
    expect(jobs[0].clip_count).toBe(3);
    expect(jobs[0].status).toBe("completed");
  });
});

describe("jobs.get()", () => {
  it("fetches a single job with clips", async () => {
    globalThis.fetch = mockFetch(200, {
      id: "99",
      title: "Full detail",
      status: "completed",
      clips: [
        { id: "1", url: "https://example.com/clip.mp4", duration_seconds: 30 },
      ],
    });

    const client = makeClient();
    const job = await client.jobs.get("99");

    expect(job.id).toBe("99");
    expect(job.clips).toHaveLength(1);
    expect(job.clips![0].url).toBe("https://example.com/clip.mp4");
  });
});

describe("brands.create()", () => {
  it("creates a brand and returns it", async () => {
    globalThis.fetch = mockFetch(200, {
      profile: {
        id: 1,
        name: "Acme",
        primary_color: "#1a73e8",
        secondary_color: "#ffffff",
        is_default: true,
        source: "lead",
      },
    });

    const client = makeClient();
    const brand = await client.brands.create({
      name: "Acme",
      primary_color: "#1a73e8",
      secondary_color: "#ffffff",
      source: "lead",
    });

    expect(brand.id).toBe(1);
    expect(brand.source).toBe("lead");
  });
});

describe("reels.create()", () => {
  it("submits and returns job ID", async () => {
    globalThis.fetch = mockFetch(202, {
      id: "abc-123",
      status: "pending",
      poll_url: "/api/v1/clip/abc-123",
    });

    const client = makeClient();
    const resp = await client.reels.create({
      url: "https://example.com/video.mp4",
      caption_style: "LEMON",
    });

    expect(resp.id).toBe("abc-123");
    expect(resp.status).toBe("pending");
  });
});

describe("templates.list()", () => {
  it("returns typed templates", async () => {
    globalThis.fetch = mockFetch(200, {
      templates: [
        { id: 42, name: "9:16 Reel", caption_style: "LEMON", width: 1080, height: 1920 },
        { id: 47, name: "Square", caption_style: null, width: 1080, height: 1080 },
      ],
    });

    const client = makeClient();
    const templates = await client.templates.list();

    expect(templates).toHaveLength(2);
    expect(templates[0].id).toBe(42);
    expect(templates[1].width).toBe(1080);
  });
});

describe("imageQuotes.create()", () => {
  it("renders an image quote", async () => {
    globalThis.fetch = mockFetch(200, {
      success: true,
      image_url: "https://storage.example.com/quote.png",
      media_id: 718,
    });

    const client = makeClient();
    const result = await client.imageQuotes.create({
      quote_text: "Test quote",
      template_id: 42,
    });

    expect(result.success).toBe(true);
    expect(result.image_url).toContain("quote.png");
  });
});

// ── Error mapping tests ─────────────────────────────────────────────────────

describe("error classification", () => {
  it("maps 401 to AuthError", async () => {
    globalThis.fetch = mockFetch(401, { detail: "Invalid key" });
    const client = makeClient();

    await expect(client.brands.list()).rejects.toThrow(AuthError);
  });

  it("maps 404 to NotFoundError", async () => {
    globalThis.fetch = mockFetch(404, { detail: "Job not found" });
    const client = makeClient();

    await expect(client.jobs.get("9999")).rejects.toThrow(NotFoundError);
  });

  it("maps 400 to ValidationError", async () => {
    globalThis.fetch = mockFetch(400, {
      detail: "Validation failed",
      primary_color: ["Invalid hex"],
    });
    const client = makeClient();

    await expect(
      client.brands.create({ name: "X", primary_color: "bad", secondary_color: "#fff" })
    ).rejects.toThrow(ValidationError);
  });

  it("maps 429 to RateLimitError with retryAfter", async () => {
    globalThis.fetch = mockFetch(
      429,
      { detail: "Too many requests" },
      { "Retry-After": "12" }
    );
    const client = new SMLClient({
      apiKey: "sml_test_key_1234567890",
      baseUrl: "https://api.test.somanylemons.com",
      maxRetries: 0,
    });

    try {
      await client.content.getUsage();
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBe(12);
    }
  });

  it("maps 403 with quota detail to QuotaError", async () => {
    globalThis.fetch = mockFetch(403, {
      detail: "render_quota exceeded",
      renders_used: 5,
      render_limit: 5,
    });
    const client = makeClient();

    try {
      await client.reels.create({ url: "https://example.com/v.mp4" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(QuotaError);
      expect((err as QuotaError).rendersUsed).toBe(5);
      expect((err as QuotaError).renderLimit).toBe(5);
    }
  });

  it("maps 500 to ServerError", async () => {
    globalThis.fetch = mockFetch(500, { detail: "Internal error" });
    const client = new SMLClient({
      apiKey: "sml_test_key_1234567890",
      baseUrl: "https://api.test.somanylemons.com",
      maxRetries: 0,
    });

    await expect(client.jobs.list()).rejects.toThrow(ServerError);
  });
});

// ── Security tests ──────────────────────────────────────────────────────────

describe("security", () => {
  it("rejects empty API key", () => {
    expect(
      () => new SMLClient({ apiKey: "", baseUrl: "https://api.somanylemons.com" })
    ).toThrow(AuthError);
  });

  it("rejects insecure HTTP by default", () => {
    expect(
      () => new SMLClient({ apiKey: "sml_test1234567890", baseUrl: "http://api.somanylemons.com" })
    ).toThrow(SMLError);
  });

  it("accepts insecure HTTP with explicit opt-in", () => {
    const c = new SMLClient({
      apiKey: "sml_test1234567890",
      baseUrl: "http://localhost:8000",
      allowInsecureHttp: true,
    });
    expect(c.baseUrl).toBe("http://localhost:8000");
  });

  it("rejects foreign host by default", () => {
    expect(
      () => new SMLClient({ apiKey: "sml_test1234567890", baseUrl: "https://evil.com" })
    ).toThrow(SMLError);
  });

  it("accepts foreign host with explicit opt-in", () => {
    const c = new SMLClient({
      apiKey: "sml_test1234567890",
      baseUrl: "https://staging.example.com",
      allowForeignHost: true,
    });
    expect(c.baseUrl).toBe("https://staging.example.com");
  });

  it("does not leak API key via JSON.stringify", () => {
    const c = new SMLClient({
      apiKey: "sml_SuperSecretKeyNeverLeak12345",
      baseUrl: "https://api.somanylemons.com",
    });
    const serialized = JSON.stringify(c);
    expect(serialized).not.toContain("SuperSecret");
    expect(serialized).not.toContain("NeverLeak");
  });

  it("does not leak API key via toString", () => {
    const c = new SMLClient({
      apiKey: "sml_SuperSecretKeyNeverLeak12345",
      baseUrl: "https://api.somanylemons.com",
    });
    expect(c.toString()).not.toContain("SuperSecret");
  });
});

// ── Config tests ────────────────────────────────────────────────────────────

describe("configuration", () => {
  it("reads API key from env", () => {
    const prev = process.env.SML_API_KEY;
    process.env.SML_API_KEY = "sml_from_env_1234567890";
    try {
      // @ts-expect-error — testing env var fallback, apiKey not passed
      const c = new SMLClient({ baseUrl: "https://api.somanylemons.com" });
      expect(c.baseUrl).toBe("https://api.somanylemons.com");
    } finally {
      if (prev) process.env.SML_API_KEY = prev;
      else delete process.env.SML_API_KEY;
    }
  });

  it("exposes all 8 resources", () => {
    const c = makeClient();
    expect(c.jobs).toBeDefined();
    expect(c.reels).toBeDefined();
    expect(c.brands).toBeDefined();
    expect(c.drafts).toBeDefined();
    expect(c.imageQuotes).toBeDefined();
    expect(c.templates).toBeDefined();
    expect(c.transcribe).toBeDefined();
    expect(c.content).toBeDefined();
  });
});
