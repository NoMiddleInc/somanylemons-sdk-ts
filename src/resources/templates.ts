import { HttpTransport } from "../http.js";
import type { Template } from "../types.js";

export class TemplatesResource {
  constructor(private readonly t: HttpTransport) {}

  async list(): Promise<Template[]> {
    const data = await this.t.request<{ templates: Template[] }>({
      method: "GET",
      path: "/api/v1/templates",
    });
    return data.templates ?? [];
  }
}
