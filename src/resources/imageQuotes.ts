import { HttpTransport } from "../http.js";
import type { ImageQuoteParams, ImageQuoteResult } from "../types.js";

export class ImageQuotesResource {
  constructor(private readonly t: HttpTransport) {}

  async create(params: ImageQuoteParams): Promise<ImageQuoteResult> {
    return this.t.request<ImageQuoteResult>({
      method: "POST",
      path: "/api/v1/image-quote",
      body: params,
    });
  }
}
