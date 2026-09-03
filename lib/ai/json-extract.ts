/**
 * Loose JSON extraction for model responses.
 *
 * Models sometimes wrap JSON in markdown fences or append trailing
 * text after the object. A plain JSON.parse throws
 * "Unexpected non-whitespace character after JSON" on such output.
 * This helper tries direct parse, then fence-stripped parse, then a
 * balanced brace scan from the first `{`.
 */

export function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // fall through to lenient strategies
  }

  const t = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    // fall through to brace scan
  }

  const start = t.indexOf("{");
  if (start === -1) throw new SyntaxError("No JSON object found in response.");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return JSON.parse(t.slice(start, i + 1));
      }
    }
  }
  throw new SyntaxError("Unbalanced JSON in response.");
}
