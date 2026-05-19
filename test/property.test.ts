import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { addBusinessDays, isBusinessDay, businessDaysBetween } from "../src/index.js";

const dateBetween = (start: Date, end: Date) =>
  fc
    .date({ min: start, max: end, noInvalidDate: true })
    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()));

const start = new Date(2020, 0, 1);
const end = new Date(2030, 11, 31);

describe("property: addBusinessDays / subBusinessDays are inverse", () => {
  it("add then subtract returns original (when start is a business day)", () => {
    fc.assert(
      fc.property(dateBetween(start, end), fc.integer({ min: 1, max: 100 }), (d, n) => {
        fc.pre(isBusinessDay(d));
        const forward = addBusinessDays(d, n);
        const back = addBusinessDays(forward, -n);
        expect(back.getTime()).toBe(d.getTime());
      }),
    );
  });
});

describe("property: addBusinessDays output is always a business day", () => {
  it("for positive n", () => {
    fc.assert(
      fc.property(dateBetween(start, end), fc.integer({ min: 1, max: 50 }), (d, n) => {
        const r = addBusinessDays(d, n);
        expect(isBusinessDay(r)).toBe(true);
      }),
    );
  });

  it("for negative n", () => {
    fc.assert(
      fc.property(dateBetween(start, end), fc.integer({ min: 1, max: 50 }), (d, n) => {
        const r = addBusinessDays(d, -n);
        expect(isBusinessDay(r)).toBe(true);
      }),
    );
  });
});

describe("property: businessDaysBetween counts correctly", () => {
  it("from-to equals -to-from", () => {
    fc.assert(
      fc.property(dateBetween(start, end), dateBetween(start, end), (a, b) => {
        // `expect.toBe` uses `Object.is`, which distinguishes +0 / -0; for the
        // a===b case both sides are 0 — compare by mathematical equality.
        expect(businessDaysBetween(a, b) + businessDaysBetween(b, a)).toBe(0);
      }),
    );
  });

  it("adding N business days then counting gives N (from a business day)", () => {
    fc.assert(
      fc.property(dateBetween(start, end), fc.integer({ min: 1, max: 20 }), (d, n) => {
        fc.pre(isBusinessDay(d));
        const target = addBusinessDays(d, n);
        expect(businessDaysBetween(d, target)).toBe(n);
      }),
    );
  });
});
