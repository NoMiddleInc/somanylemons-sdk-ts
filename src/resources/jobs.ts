import { JobFailedError, TimeoutError } from "../errors.js";
import { HttpTransport } from "../http.js";
import type { Job, JobStatus } from "../types.js";

export class JobsResource {
  constructor(private readonly t: HttpTransport) {}

  async list(opts?: {
    limit?: number;
    status?: JobStatus;
    source?: "api" | "web" | "all";
    include?: string;
  }): Promise<Job[]> {
    const data = await this.t.request<{ jobs: Job[] }>({
      method: "GET",
      path: "/api/v1/jobs",
      params: {
        limit: opts?.limit,
        status: opts?.status,
        source: opts?.source,
        include: opts?.include,
      },
    });
    return data.jobs ?? [];
  }

  async get(jobId: string | number): Promise<Job> {
    return this.t.request<Job>({
      method: "GET",
      path: `/api/v1/clip/${jobId}`,
    });
  }

  async waitFor(
    jobId: string | number,
    opts?: {
      timeoutMs?: number;
      pollIntervalMs?: number;
      onProgress?: (job: Job) => void;
    },
  ): Promise<Job> {
    const timeout = opts?.timeoutMs ?? 600_000;
    const interval = opts?.pollIntervalMs ?? 5_000;
    const deadline = Date.now() + timeout;
    let job: Job | undefined;

    while (Date.now() < deadline) {
      job = await this.get(jobId);
      opts?.onProgress?.(job);
      if (job.status === "completed") return job;
      if (job.status === "failed") {
        throw new JobFailedError(job.error ?? `Job ${jobId} failed`, job);
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    throw new TimeoutError(
      `Job ${jobId} did not complete within ${timeout}ms ` +
        `(last status: ${job?.status ?? "unknown"})`,
    );
  }
}
