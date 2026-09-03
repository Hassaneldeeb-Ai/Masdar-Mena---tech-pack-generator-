import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/ai/json-extract";

describe("extractJson — lenient model-response parsing", () => {
  it("parses a plain JSON object", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses JSON wrapped in markdown fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("parses JSON followed by trailing non-whitespace text", () => {
    // This is the exact error "Unexpected non-whitespace character after JSON".
    const poisoned = '{"products":{"name":"Hat"}}\n\nNote: this spec assumes a 100-unit run.';
    expect(extractJson(poisoned)).toEqual({ products: { name: "Hat" } });
  });

  it("parses JSON with trailing closing fence + text", () => {
    const poisoned = '```json\n{"version":"V1.0"}\n```\n\nEnd of response.';
    expect(extractJson(poisoned)).toEqual({ version: "V1.0" });
  });

  it("parses JSON nested in surrounding prose", () => {
    const poisoned = 'Here is your spec:\n{"ok":true}\nRegards, model.';
    expect(extractJson(poisoned)).toEqual({ ok: true });
  });

  it("handles escaped quotes and braces inside strings", () => {
    const input = '{"text":"a \\"quoted\\" { brace }","arr":[1,2,3]}';
    expect(extractJson(input)).toEqual({ text: 'a "quoted" { brace }', arr: [1, 2, 3] });
  });

  it("throws on totally non-JSON text", () => {
    expect(() => extractJson("no json here at all")).toThrow();
  });

  it("throws on unbalanced JSON", () => {
    expect(() => extractJson('{"a": {')).toThrow();
  });
});
