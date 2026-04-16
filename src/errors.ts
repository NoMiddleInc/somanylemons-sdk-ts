/** Typed error hierarchy — mirrors the Python SDK exactly. */

export class SMLError extends Error {
  readonly statusCode: number | null;
  readonly responseBody: unknown;

  constructor(
    message: string,
    opts?: { statusCode?: number; responseBody?: unknown },
  ) {
    super(message);
    this.name = "SMLError";
    this.statusCode = opts?.statusCode ?? null;
    this.responseBody = opts?.responseBody ?? null;
  }
}

export class AuthError extends SMLError {
  constructor(message: string, body?: unknown) {
    super(message, { statusCode: 401, responseBody: body });
    this.name = "AuthError";
  }
}

export class PermissionError extends SMLError {
  constructor(message: string, body?: unknown) {
    super(message, { statusCode: 403, responseBody: body });
    this.name = "PermissionError";
  }
}

export class NotFoundError extends SMLError {
  constructor(message: string, body?: unknown) {
    super(message, { statusCode: 404, responseBody: body });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends SMLError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, body?: unknown, fieldErrors?: Record<string, string[]>) {
    super(message, { statusCode: 400, responseBody: body });
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors ?? {};
  }
}

export class RateLimitError extends SMLError {
  readonly retryAfter: number | null;

  constructor(message: string, retryAfter?: number | null, body?: unknown) {
    super(message, { statusCode: 429, responseBody: body });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter ?? null;
  }
}

export class QuotaError extends SMLError {
  readonly rendersUsed: number | null;
  readonly renderLimit: number | null;

  constructor(
    message: string,
    opts?: { rendersUsed?: number; renderLimit?: number; body?: unknown },
  ) {
    super(message, { statusCode: 403, responseBody: opts?.body });
    this.name = "QuotaError";
    this.rendersUsed = opts?.rendersUsed ?? null;
    this.renderLimit = opts?.renderLimit ?? null;
  }
}

export class ServerError extends SMLError {
  constructor(message: string, statusCode: number, body?: unknown) {
    super(message, { statusCode, responseBody: body });
    this.name = "ServerError";
  }
}

export class TimeoutError extends SMLError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class JobFailedError extends SMLError {
  readonly job: unknown;

  constructor(message: string, job?: unknown) {
    super(message);
    this.name = "JobFailedError";
    this.job = job ?? null;
  }
}
