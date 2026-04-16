import { HttpTransport } from "../http.js";
import type { Usage } from "../types.js";

export class ContentResource {
  constructor(private readonly t: HttpTransport) {}

  async generatePost(params: { topic: string }): Promise<Record<string, unknown>> {
    return this.t.request({
      method: "POST",
      path: "/api/v1/write/generate",
      body: params,
    });
  }

  async scorePost(params: { post_text: string }): Promise<Record<string, unknown>> {
    return this.t.request({
      method: "POST",
      path: "/api/v1/write/score",
      body: params,
    });
  }

  async rewritePost(params: {
    post_text: string;
    feedback?: string[];
  }): Promise<Record<string, unknown>> {
    return this.t.request({
      method: "POST",
      path: "/api/v1/write/rewrite",
      body: params,
    });
  }

  async extractQuotes(params: {
    text: string;
    count?: number;
  }): Promise<Record<string, unknown>> {
    return this.t.request({
      method: "POST",
      path: "/api/v1/extract-clips",
      body: { text: params.text, count: params.count ?? 8 },
    });
  }

  async getUsage(): Promise<Usage> {
    return this.t.request<Usage>({ method: "GET", path: "/api/v1/usage" });
  }
}
