/** All TypeScript interfaces for API request/response shapes. */

// ── Jobs ────────────────────────────────────────────────────────────────────

export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type ClipSource = "api" | "web";

export interface UploadedBy {
  id: number | null;
  name: string | null;
  email: string | null;
}

export interface JobClip {
  id: string;
  url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  transcript: string | null;
}

/** Compact job from list endpoint (no clips array). */
export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  progress?: number;
  source?: ClipSource;
  source_type?: string;
  input_type?: string;
  duration_seconds?: number | null;
  transcript_preview?: string;
  uploaded_by?: UploadedBy | null;
  clip_count?: number;
  clips?: JobClip[];
  error?: string | null;
  created_at?: string | null;
}

// ── Brands ──────────────────────────────────────────────────────────────────

export type BrandSource = "user" | "lead" | "system";

export interface Brand {
  id: number;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  is_default: boolean;
  source?: BrandSource;
}

export interface BrandCreateParams {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  logo_url?: string;
  is_default?: boolean;
  source?: BrandSource;
}

// ── Reels ───────────────────────────────────────────────────────────────────

export type CaptionStyle =
  | "LEMON" | "VITAMIN_C" | "PLAIN" | "SPOTLIGHT"
  | "GLITCH" | "RANSOM" | "WAVE" | "BOUNCE";

export type BackgroundType = "solid" | "image" | "video" | "gradient";

export interface Background {
  type: BackgroundType;
  color?: string;
  image_url?: string;
  image_fit?: "cover" | "contain" | "fill";
  video_url?: string;
  gradient?: Record<string, unknown>;
}

export interface CaptionConfig {
  text_color?: string;
  highlight_color?: string;
  font_size?: number;
  font_family?: string;
  stroke_color?: string;
  stroke_width?: number;
  background_color?: string;
  background_opacity?: number;
  text_transform?: "none" | "uppercase" | "lowercase";
  max_words_per_phrase?: number;
  style_params?: Record<string, number>;
}

export interface ReelsCreateParams {
  url: string;
  brand_profile_id?: number;
  caption_style?: CaptionStyle;
  background?: Background;
  logo_url?: string;
  headshot_url?: string;
  caption_config?: CaptionConfig;
  show_speaker?: boolean;
  show_headshot?: boolean;
  webhook_url?: string;
  composition_overrides?: Record<string, unknown>;
}

export interface ReelsResponse {
  id: string;
  status: string;
  poll_url?: string;
}

// ── Image Quote ─────────────────────────────────────────────────────────────

export type ImageQuoteArchetype =
  | "QUOTE_HERO" | "STAT" | "TESTIMONIAL" | "EVENT" | "PRESS" | "COLLAGE";
export type ImageQuoteSize = "square" | "portrait" | "horizontal";

export interface ImageQuoteParams {
  quote_text: string;
  brand_profile_id?: number;
  speaker_name?: string;
  speaker_title?: string;
  size?: ImageQuoteSize;
  template_id?: number;
  archetype?: ImageQuoteArchetype;
  draft_id?: number;
}

export interface ImageQuoteResult {
  success: boolean;
  image_url: string | null;
  media_id: number | null;
  draft_id: number | null;
}

// ── Drafts ──────────────────────────────────────────────────────────────────

export type DraftStatus = "draft" | "queued" | "scheduled" | "posted";

export interface Draft {
  id: number;
  caption: string;
  status: DraftStatus;
  media_url?: string | null;
  media_thumb?: string | null;
  content_type?: string | null;
  engagement_scores?: Record<string, number> | null;
  scheduled_for?: string | null;
  created_at?: string | null;
  share_url?: string | null;
}

export interface DraftCreateParams {
  caption: string;
  job_id?: string;
}

// ── Templates ───────────────────────────────────────────────────────────────

export interface Template {
  id: number;
  name: string;
  caption_style: string | null;
  thumbnail: string | null;
  width: number;
  height: number;
}

// ── Usage ───────────────────────────────────────────────────────────────────

export interface Usage {
  billing_period: string;
  tier: string;
  render_limit: number;
  renders_used: number;
  renders_remaining: number;
  has_metered_billing: boolean;
  counts: Record<string, number>;
}

// ── Client config ───────────────────────────────────────────────────────────

export interface SMLClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  /** Allow http:// URLs (e.g. localhost dev). Default false. */
  allowInsecureHttp?: boolean;
  /** Allow non-somanylemons.com hosts. Default false. */
  allowForeignHost?: boolean;
}
