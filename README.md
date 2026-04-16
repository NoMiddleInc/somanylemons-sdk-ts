# SoManyLemons TypeScript SDK

Typed TypeScript client for the [SoManyLemons Public API](https://api.somanylemons.com/api/v1/docs/). Submit recordings, render branded reels and image quotes, manage brands and drafts — from any Node.js, Deno, or Bun app.

**Zero runtime dependencies** — uses native `fetch` (Node 18+).

## Install

```bash
npm install somanylemons-sdk
```

## Quickstart

```typescript
import { SMLClient } from "somanylemons-sdk";

const client = new SMLClient({ apiKey: "sml_your_key_here" });

// List recordings
const jobs = await client.jobs.list({ limit: 5 });
for (const job of jobs) {
  console.log(job.id, job.title, job.clip_count, "clips");
}

// Submit a video and wait for rendered clips
const job = await client.reels.createAndWait({
  url: "https://example.com/recording.mp4",
  brand_profile_id: 1,
  caption_style: "LEMON",
});
for (const clip of job.clips ?? []) {
  console.log(clip.url);
}

// Render an image quote with a pinned template
const image = await client.imageQuotes.create({
  quote_text: "Labor productivity is the story of the next five years.",
  brand_profile_id: 1,
  template_id: 42,
});
console.log(image.image_url);
```

## Configuration

| Option | Env var | Default | Notes |
|---|---|---|---|
| `apiKey` | `SML_API_KEY` | — (required) | Your `sml_xxx` key |
| `baseUrl` | `SML_API_URL` | `https://api.somanylemons.com` | Override for QAS / local |
| `timeout` | — | `30000` | Milliseconds per request |
| `maxRetries` | — | `3` | Retries on 5xx and 429 |
| `allowInsecureHttp` | — | `false` | Allow `http://` (for localhost) |
| `allowForeignHost` | — | `false` | Allow non-somanylemons.com hosts |

## Resources

| Attribute | Endpoints |
|---|---|
| `client.jobs` | List, get, poll recordings |
| `client.reels` | Create reels (async or blocking via `createAndWait`) |
| `client.transcribe` | Transcribe URL (async or blocking) |
| `client.imageQuotes` | Render branded quote images |
| `client.brands` | Manage brand profiles |
| `client.drafts` | Content queue |
| `client.templates` | List available templates |
| `client.content` | Generate / score / rewrite posts, extract quotes, usage |

## Error handling

```typescript
import { SMLClient, QuotaError, RateLimitError, JobFailedError } from "somanylemons-sdk";

const client = new SMLClient({ apiKey: "sml_xxx" });

try {
  const job = await client.reels.createAndWait({ url: "..." });
} catch (err) {
  if (err instanceof QuotaError) {
    console.log(`Over quota: ${err.rendersUsed}/${err.renderLimit}`);
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${err.retryAfter}s`);
  } else if (err instanceof JobFailedError) {
    console.log(`Render failed: ${err.message}`);
  }
}
```

## Security

- **Keys never appear in `toString()` or logs.** The transport masks the key.
- **HTTPS enforced by default.** `http://` URLs are rejected unless `allowInsecureHttp: true`.
- **Foreign hosts rejected by default.** Only `*.somanylemons.com` and `localhost` are accepted.
- **Sensible retries.** 5xx and 429 retry with backoff; 4xx fails fast.

## License

MIT
