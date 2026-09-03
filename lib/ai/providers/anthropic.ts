import type { JsonCompleteArgs, LLMProvider } from "../types";
import { extractJson } from "../json-extract";

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  }

  async jsonComplete(args: JsonCompleteArgs): Promise<unknown> {
    const content: unknown[] = [{ type: "text", text: args.prompt }];
    if (args.image) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: args.image.mime,
          data: args.image.base64,
        },
      });
    }
    if (args.imageBack) {
      content.push({ type: "text", text: "Second image: the BACK view of the same product." });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: args.imageBack.mime,
          data: args.imageBack.base64,
        },
      });
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: 4096,
        system: args.system,
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      throw new Error(`Anthropic request failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");
    return extractJson(text || "null");
  }
}
