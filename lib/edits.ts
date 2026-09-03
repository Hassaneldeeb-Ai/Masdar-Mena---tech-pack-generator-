/**
 * Minimal JSON path get/set used by the human-in-the-loop edit system.
 * Paths are like "measurements.0.tolerance" or "materials.2.gsm".
 */
export function getPath(obj: unknown, path: string): unknown {
  if (path === "") return obj;
  let cur: Record<string, unknown> | undefined = obj as Record<string, unknown>;
  for (const seg of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur?.[seg] as Record<string, unknown> | undefined;
  }
  return cur;
}

export function setPath(obj: unknown, path: string, value: unknown): unknown {
  if (!isValidPath(path)) {
    throw new Error(`Invalid path: ${path}`);
  }
  const clone = structuredClone(obj);
  const segs = path.split(".");
  let cur = clone as Record<string, unknown>;
  for (let i = 0; i < segs.length - 1; i++) {
    if (cur[segs[i]] == null) cur[segs[i]] = {};
    cur = cur[segs[i]] as Record<string, unknown>;
  }
  cur[segs[segs.length - 1]] = value;
  return clone;
}

export function isValidPath(path: string): boolean {
  if (/(^|\.)(__proto__|constructor|prototype)(\.|$)/.test(path)) {
    return false;
  }
  return /^[a-zA-Z_][\w]*(\.[a-zA-Z_][\w]*|\.\d+)*$/.test(path);
}
