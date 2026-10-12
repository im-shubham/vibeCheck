export type AIErrorCode =
  | "not_configured"
  | "auth"
  | "quota"
  | "invalid_model"
  | "rate_limited"
  | "timeout"
  | "upstream"
  | "malformed"
  | "unsafe_output";

/** An AI failure with a safe, user-facing message. Never carries the raw upstream error. */
export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    public readonly status: number,
    public readonly userMessage: string,
    public readonly retryable = false,
  ) {
    super(code);
    this.name = "AIError";
  }
}

export type PolishTone = "professional" | "hype" | "storyteller";
