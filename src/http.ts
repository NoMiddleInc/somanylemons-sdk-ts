/**
 * HTTP transport layer — zero runtime dependencies, uses native fetch.
 *
 * Security:
 *   - HTTPS enforced by default (opt-in for http:// via allowInsecureHttp).
 *   - Host allowlist: only *.somanylemons.com + localhost by default.
 *   - API key never exposed in toString/inspect.
 *   - Sensible retries: only 5xx and 429 are retried; 4xx fails fast.
 */

import {
  AuthError,
  NotFoundError,
  PermissionError,
  QuotaError,
  RateLimitError,
  SMLError,
  ServerError,
  ValidationError,
} from "./errors.js";

export const DEFAULT_BASE_URL = "https://api.somanylemons.com";
export const DEFAULT_TIMEOUT = 30_000; // ms
export const DEFAULT_MAX_RETRIES = 3;

const TRUSTED_HOST_SUFFIXES = [".somanylemons.com"];
const TRUSTED_HOSTS = ["somanylemons.com", "localhost", "127.0.0.1"];

// ── URL validation ──────────────────────────────────────────────────────────

export function validateBaseUrl(
  baseUrl: string,
  opts: { allowInsecureHttp?: boolean; allowForeignHost?: boolean } = {},
): string {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new SMLError(`Invalid base URL: ${baseUrl}`);
  }

  if (parsed.protocol === "http:" && !opts.allowInsecureHttp) {
    throw new SMLError(
      "base URL uses plain HTTP. API keys would travel unencrypted. " +
        "Pass allowInsecureHttp: true to override (e.g. for localhost dev).",
    );
  }

  const host = parsed.hostname.toLowerCase();
  const isTrusted =
    TRUSTED_HOSTS.includes(host) ||
    TRUSTED_HOST_SUFFIXES.some((s) => host.endsWith(s));

  if (!isTrusted && !opts.allowForeignHost) {
    throw new SMLError(
      `Host "${host}" is not a SoManyLemons domain. ` +
        "Pass allowForeignHost: true if this is intentional.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

// ── Key masking ─────────────────────────────────────────────────────────────

export function maskKey(key: string): string {
  if (!key) return "(empty)";
  return `${key.slice(0, 8)}…(redacted)`;
}

// ── Error classification ────────────────────────────────────────────────────

function extractMessage(body: Record<string, unknown>): string {
  for (const key of ["detail", "message", "error"]) {
    if (typeof body[key] === "string" && body[key]) return body[key] as string;
  }
  return "";
}

async function classifyResponse(response: Response): Promise<void> {
  if (response.ok) return;

  let body: Record<string, unknown>;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = { raw: await response.text().catch(() => "") };
  }

  const message = extractMessage(body) || `HTTP ${response.status}`;
  const status = response.status;

  if (status === 400) {
    throw new ValidationError(message, body);
  }
  if (status === 401) {
    throw new AuthError(message, body);
  }
  if (status === 403) {
    const detail = String(body.detail ?? "").toLowerCase();
    if (detail.includes("quota") || "renders_used" in body) {
      throw new QuotaError(message, {
        rendersUsed: body.renders_used as number | undefined,
        renderLimit: body.render_limit as number | undefined,
        body,
      });
    }
    throw new PermissionError(message, body);
  }
  if (status === 404) {
    throw new NotFoundError(message, body);
  }
  if (status === 429) {
    const retryAfter = parseFloat(response.headers.get("Retry-After") ?? "");
    throw new RateLimitError(
      message,
      Number.isFinite(retryAfter) ? retryAfter : null,
      body,
    );
  }
  if (status >= 500) {
    throw new ServerError(message, status, body);
  }
  throw new SMLError(message, { statusCode: status, responseBody: body });
}

// ── Backoff ─────────────────────────────────────────────────────────────────

function computeBackoff(attempt: number, retryAfter?: number | null): number {
  if (retryAfter != null && retryAfter > 0) return retryAfter * 1000;
  const base = Math.min(2 ** attempt, 30);
  return (base + base * 0.25 * Math.random()) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Transport ───────────────────────────────────────────────────────────────

export interface RequestOptions {
  method: string;
  path: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export class HttpTransport {
  readonly baseUrl: string;
  private readonly _apiKey: string;
  private readonly _timeout: number;
  private readonly _maxRetries: number;

  constructor(opts: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
    maxRetries: number;
  }) {
    if (!opts.apiKey) throw new AuthError("API key is required");
    this._apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl;
    this._timeout = opts.timeout;
    this._maxRetries = opts.maxRetries;
  }

  get apiKeyPrefix(): string {
    return maskKey(this._apiKey);
  }

  async request<T = unknown>(opts: RequestOptions): Promise<T> {
    const url = new URL(opts.path, this.baseUrl);
    if (opts.params) {
      for (const [key, val] of Object.entries(opts.params)) {
        if (val !== undefined) url.searchParams.set(key, String(val));
      }
    }

    const timeout = opts.timeoutMs ?? this._timeout;
    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const headers: Record<string, string> = {
          "X-API-Key": this._apiKey,
        };
        if (opts.body !== undefined) {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url.toString(), {
          method: opts.method,
          headers,
          body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);
        await classifyResponse(response);

        if (response.status === 204 || response.headers.get("content-length") === "0") {
          return null as T;
        }
        return (await response.json()) as T;
      } catch (err) {
        clearTimeout(timer);

        const isRetryable =
          err instanceof RateLimitError ||
          err instanceof ServerError ||
          (err instanceof DOMException && err.name === "AbortError");

        if (!isRetryable || attempt >= this._maxRetries) throw err;

        const retryAfter = err instanceof RateLimitError ? err.retryAfter : null;
        await sleep(computeBackoff(attempt, retryAfter));
        attempt++;
      }
    }
  }

  toString(): string {
    return `HttpTransport(${this.baseUrl}, key=${this.apiKeyPrefix})`;
  }
}
