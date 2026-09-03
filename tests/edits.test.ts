import { describe, expect, it } from "vitest";
import { getPath, isValidPath, setPath } from "@/lib/edits";

describe("isValidPath", () => {
  it("accepts dot paths into arrays and objects", () => {
    expect(isValidPath("materials.0.gsm")).toBe(true);
    expect(isValidPath("product.name")).toBe(true);
    expect(isValidPath("measurements.2.values.M")).toBe(true);
  });

  it("rejects prototype-pollution and malformed paths", () => {
    expect(isValidPath("__proto__.polluted")).toBe(false);
    expect(isValidPath("a.__proto__.b")).toBe(false);
    expect(isValidPath("constructor")).toBe(false);
    expect(isValidPath("a.prototype.b")).toBe(false);
    expect(isValidPath("")).toBe(false);
    expect(isValidPath(".hidden")).toBe(false);
    expect(isValidPath("a..b")).toBe(false);
    expect(isValidPath("0.1")).toBe(false);
  });
});

describe("setPath", () => {
  it("sets a nested value without mutating the original", () => {
    const original = { a: { b: [ { c: 1 } ] } };
    const next = setPath(original, "a.b.0.c", 42);
    expect(next).toEqual({ a: { b: [ { c: 42 } ] } });
    expect(original.a.b[0].c).toBe(1);
  });

  it("throws on invalid paths instead of writing", () => {
    const obj = { a: 1 };
    expect(() => setPath(obj, "__proto__.polluted", "evil")).toThrow();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("getPath", () => {
  it("reads nested values and returns undefined for missing ones", () => {
    const obj = { a: { b: [ { c: 7 } ] } };
    expect(getPath(obj, "a.b.0.c")).toBe(7);
    expect(getPath(obj, "a.b.9.c")).toBeUndefined();
    expect(getPath(obj, "nope.deep")).toBeUndefined();
  });
});
