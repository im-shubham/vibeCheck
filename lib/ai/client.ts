import "server-only";
import OpenAI from "openai";
import { AIError } from "./types";
export { assertFaithful } from "./guard";

let client: OpenAI | null = null;

export const aiConfigured = () => Boolean(process.env.OPENAI_API_KEY);
export const getModel = () => process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIError("not_configured", 503, "AI features aren't set up on this server yet.");
  // maxRetries: 0 — retries are handled below, bounded and only for transient errors.
  client ??= new OpenAI({ apiKey, maxRetries: 0, timeout: 20_000 });
  return client;
}

/** Translate any upstream failure into a safe AIError. Raw errors are logged server-side only. */
export function mapError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return new AIError("timeout", 504, "The AI took too long to respond. Please try again.", true);
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return new AIError("upstream", 503, "We couldn't reach the AI service. Please try again.", true);
  }
  if (err instanceof OpenAI.APIError) {
    const status = err.status ?? 0;
    const code = String(err.code ?? "");
    if (status === 401 || status === 403) {
      return new AIError("auth", 503, "AI is temporarily unavailable (server configuration issue).");
    }
    if (status === 429 && code === "insufficient_quota") {
      return new AIError("quota", 503, "AI is temporarily unavailable (provider quota reached).");
    }
    if (status === 429) return new AIError("rate_limited", 429, "The AI service is busy. Please try again shortly.", true);
    if (status === 404 || code === "model_not_found") {
      return new AIError("invalid_model", 503, "AI is temporarily unavailable (model misconfigured).");
    }
    if (status === 408 || status === 409 || status >= 500) {
      return new AIError("upstream", 503, "The AI service had a temporary problem. Please try again.", true);
    }
    return new AIError("upstream", 502, "The AI request couldn't be completed.");
  }
  return new AIError("upstream", 502, "The AI request couldn't be completed.");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Bounded exponential backoff with jitter; retries ONLY transient errors. */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseMs = 400): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      const mapped = mapError(e);
      attempt += 1;
      console.error(`[ai] attempt ${attempt} failed: ${mapped.code}`);
      if (!mapped.retryable || attempt >= maxAttempts) throw mapped;
      await sleep(baseMs * 2 ** (attempt - 1) + Math.random() * 150);
    }
  }
}

interface CompletionOptions {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

/** Returns the raw text content of one chat completion. */
export async function complete({ system, user, maxTokens, temperature = 0.4, jsonSchema }: CompletionOptions): Promise<string> {
  const openai = getClient();
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: getModel(),
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonSchema
        ? { response_format: { type: "json_schema" as const, json_schema: { name: jsonSchema.name, strict: true, schema: jsonSchema.schema } } }
        : {}),
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) throw new AIError("malformed", 502, "The AI returned an empty response. Please try again.");
    return text;
  });
}
