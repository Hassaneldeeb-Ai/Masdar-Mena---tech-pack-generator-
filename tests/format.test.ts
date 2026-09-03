import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/lib/format";

describe("formatDateTime", () => {
  it("formats a fixed UTC timestamp deterministically", () => {
    expect(formatDateTime("2024-05-24T13:00:00Z")).toBe("2024/05/24 13:00 UTC");
  });

  it("produces identical output regardless of host timezone", () => {
    const iso = "2025-01-02T23:30:00Z";
    const inUtc = withTimeZone("UTC", () => formatDateTime(iso));
    const inNy = withTimeZone("America/New_York", () => formatDateTime(iso));
    expect(inUtc).toBe(inNy);
    expect(inUtc).toBe("2025/01/02 23:30 UTC");
  });

  it("renders an em dash for invalid input instead of Invalid Date", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});

function withTimeZone(tz: string, fn: () => string): string {
  const prev = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
}
