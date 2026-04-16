import { HttpTransport } from "../http.js";
import type { Job, ReelsCreateParams, ReelsResponse } from "../types.js";
import type { JobsResource } from "./jobs.js";

export class ReelsResource {
  constructor(
    private readonly t: HttpTransport,
    private readonly jobs: JobsResource,
  ) {}

  async create(params: ReelsCreateParams): Promise<ReelsResponse> {
    return this.t.request<ReelsResponse>({
      method: "POST",
      path: "/api/v1/clip",
      body: params,
    });
  }

  async createAndWait(
    params: ReelsCreateParams,
    opts?: {
      timeoutMs?: number;
      pollIntervalMs?: number;
      onProgress?: (job: Job) => void;
    },
  ): Promise<Job> {
    const resp = await this.create(params);
    return this.jobs.waitFor(resp.id, {
      timeoutMs: opts?.timeoutMs ?? 600_000,
      pollIntervalMs: opts?.pollIntervalMs ?? 10_000,
      onProgress: opts?.onProgress,
    });
  }
}
