import type { JsonCompleteArgs, LLMProvider } from "../types";
import { extractJson } from "../json-extract";

export class OpenAiProvider implements LLMProvider {
  name = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o";
  }

  async jsonComplete(args: JsonCompleteArgs): Promise<unknown> {
    const content: unknown[] = [{ type: "text", text: args.prompt }];
    if (args.image) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${args.image.mime};base64,${args.image.base64}`,
        },
      });
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 4096,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return extractJson(data.choices[0].message.content ?? "null");
  }
}
