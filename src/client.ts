/**
 * SMLClient — the entry point for all SDK interactions.
 *
 * ```ts
 * import { SMLClient } from "somanylemons-sdk";
 *
 * const client = new SMLClient({ apiKey: "sml_xxx" });
 * const jobs = await client.jobs.list({ limit: 5 });
 * ```
 */

import {
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT,
  HttpTransport,
  maskKey,
  validateBaseUrl,
} from "./http.js";
import { BrandsResource } from "./resources/brands.js";
import { ContentResource } from "./resources/content.js";
import { DraftsResource } from "./resources/drafts.js";
import { ImageQuotesResource } from "./resources/imageQuotes.js";
import { JobsResource } from "./resources/jobs.js";
import { ReelsResource } from "./resources/reels.js";
import { TemplatesResource } from "./resources/templates.js";
import { TranscribeResource } from "./resources/transcribe.js";
import type { SMLClientConfig } from "./types.js";

export class SMLClient {
  readonly jobs: JobsResource;
  readonly reels: ReelsResource;
  readonly brands: BrandsResource;
  readonly drafts: DraftsResource;
  readonly imageQuotes: ImageQuotesResource;
  readonly templates: TemplatesResource;
  readonly transcribe: TranscribeResource;
  readonly content: ContentResource;

  private readonly _transport: HttpTransport;

  constructor(config: SMLClientConfig) {
    const apiKey = config.apiKey || process.env.SML_API_KEY || "";
    const baseUrl = validateBaseUrl(
      config.baseUrl || process.env.SML_API_URL || DEFAULT_BASE_URL,
      {
        allowInsecureHttp: config.allowInsecureHttp,
        allowForeignHost: config.allowForeignHost,
      },
    );

    this._transport = new HttpTransport({
      apiKey,
      baseUrl,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    });

    this.jobs = new JobsResource(this._transport);
    this.reels = new ReelsResource(this._transport, this.jobs);
    this.brands = new BrandsResource(this._transport);
    this.drafts = new DraftsResource(this._transport);
    this.imageQuotes = new ImageQuotesResource(this._transport);
    this.templates = new TemplatesResource(this._transport);
    this.transcribe = new TranscribeResource(this._transport, this.jobs);
    this.content = new ContentResource(this._transport);
  }

  get baseUrl(): string {
    return this._transport.baseUrl;
  }

  get apiKeyPrefix(): string {
    return maskKey(process.env.SML_API_KEY ?? "");
  }

  toString(): string {
    return `SMLClient(${this.baseUrl})`;
  }
}
