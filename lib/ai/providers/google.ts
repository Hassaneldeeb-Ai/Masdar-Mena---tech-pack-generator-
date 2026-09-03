import type { JsonCompleteArgs, LLMProvider } from "../types";
import { extractJson } from "../json-extract";

export class GoogleProvider implements LLMProvider {
  name = "google";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || process.env.GOOGLE_MODEL || "gemini-3.1-flash-image";
  }

  async jsonComplete(args: JsonCompleteArgs): Promise<unknown> {
    const parts: unknown[] = [{ text: args.prompt }];
    if (args.image) {
      parts.push({
        inline_data: {
          mime_type: args.image.mime,
          data: args.image.base64,
        },
      });
    }
    if (args.imageBack) {
      parts.push({ text: "Second image: the BACK view of the same product." });
      parts.push({
        inline_data: {
          mime_type: args.imageBack.mime,
          data: args.imageBack.base64,
        },
      });
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
          systemInstruction: { parts: [{ text: args.system }] },
        }),
        signal: AbortSignal.timeout(500_000),
      }
    );
    if (!res.ok) {
      throw new Error(`Google request failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "null";
    return extractJson(text);
  }
}
