import { HttpTransport } from "../http.js";
import type { Job } from "../types.js";
import type { JobsResource } from "./jobs.js";

export class TranscribeResource {
  constructor(
    private readonly t: HttpTransport,
    private readonly jobs: JobsResource,
  ) {}

  async create(params: { url: string }): Promise<{ clip_id: string; status: string }> {
    return this.t.request({
      method: "POST",
      path: "/api/v1/transcribe",
      body: params,
    });
  }

  async createAndWait(
    params: { url: string },
    opts?: {
      timeoutMs?: number;
      pollIntervalMs?: number;
      onProgress?: (job: Job) => void;
    },
  ): Promise<Job> {
    const resp = await this.create(params);
    return this.jobs.waitFor(resp.clip_id, {
      timeoutMs: opts?.timeoutMs ?? 900_000,
      pollIntervalMs: opts?.pollIntervalMs ?? 10_000,
      onProgress: opts?.onProgress,
    });
  }
}
