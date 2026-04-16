import { HttpTransport } from "../http.js";
import type { Draft, DraftCreateParams, DraftStatus } from "../types.js";

export class DraftsResource {
  constructor(private readonly t: HttpTransport) {}

  async list(opts?: { limit?: number; status?: DraftStatus }): Promise<Draft[]> {
    const data = await this.t.request<{ drafts: Draft[] }>({
      method: "GET",
      path: "/api/v1/drafts",
      params: { limit: opts?.limit, status: opts?.status },
    });
    return data.drafts ?? [];
  }

  async create(params: DraftCreateParams): Promise<Draft> {
    return this.t.request<Draft>({
      method: "POST",
      path: "/api/v1/drafts",
      body: params,
    });
  }
}
