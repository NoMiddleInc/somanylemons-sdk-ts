/**
 * SoManyLemons TypeScript SDK.
 *
 * Zero runtime dependencies — uses native `fetch` (Node 18+, browsers, Deno, Bun).
 *
 * @example
 * ```ts
 * import { SMLClient } from "somanylemons-sdk";
 *
 * const client = new SMLClient({ apiKey: "sml_xxx" });
 * const jobs = await client.jobs.list({ limit: 5 });
 * const job = await client.reels.createAndWait({
 *   url: "https://example.com/video.mp4",
 *   brand_profile_id: 1,
 *   caption_style: "LEMON",
 * });
 * console.log(job.clips?.[0]?.url);
 * ```
 */

// Client
export { SMLClient } from "./client.js";

// Errors
export {
  SMLError,
  AuthError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  QuotaError,
  ServerError,
  TimeoutError,
  JobFailedError,
} from "./errors.js";

// Types
export type {
  SMLClientConfig,
  Job,
  JobClip,
  JobStatus,
  ClipSource,
  UploadedBy,
  Brand,
  BrandCreateParams,
  BrandSource,
  ReelsCreateParams,
  ReelsResponse,
  CaptionStyle,
  CaptionConfig,
  Background,
  BackgroundType,
  ImageQuoteParams,
  ImageQuoteResult,
  ImageQuoteArchetype,
  ImageQuoteSize,
  Draft,
  DraftCreateParams,
  DraftStatus,
  Template,
  Usage,
} from "./types.js";
