import { HttpTransport } from "../http.js";
import type { Brand, BrandCreateParams } from "../types.js";

export class BrandsResource {
  constructor(private readonly t: HttpTransport) {}

  async list(): Promise<Brand[]> {
    const data = await this.t.request<{ profiles: Brand[] }>({
      method: "GET",
      path: "/api/v1/brands",
    });
    return data.profiles ?? [];
  }

  async create(params: BrandCreateParams): Promise<Brand> {
    const data = await this.t.request<{ profile: Brand }>({
      method: "POST",
      path: "/api/v1/brands",
      body: params,
    });
    return data.profile;
  }

  async update(brandId: number, params: Partial<BrandCreateParams>): Promise<Brand> {
    const data = await this.t.request<{ profile: Brand } & Brand>({
      method: "PUT",
      path: `/api/v1/brands/${brandId}`,
      body: params,
    });
    return data.profile ?? data;
  }

  async delete(brandId: number): Promise<void> {
    await this.t.request({ method: "DELETE", path: `/api/v1/brands/${brandId}` });
  }
}
