/**
 * Deterministic, locale- and timezone-independent date formatting.
 *
 * `Date.prototype.toLocaleString` renders differently on the server and the
 * client (host TZ + locale), which caused React hydration mismatches on the
 * tech-pack pages. This helper pins the UTC instant so SSR and hydration
 * always agree.
 */
export function formatDateTime(value: string | number | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${p2(d.getUTCMonth() + 1)}/${p2(
    d.getUTCDate()
  )} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC`;
}
