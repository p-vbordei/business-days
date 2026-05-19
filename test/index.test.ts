import { describe, it, expect } from "vitest";
import {
  isBusinessDay,
  addBusinessDays,
  subBusinessDays,
  businessDaysBetween,
  nextBusinessDay,
} from "../src/index.js";

// Reference dates (constructed via numbers to avoid TZ flakiness).
// 2026-05-18 = Monday, 2026-05-19 = Tuesday, ..., 2026-05-23 = Saturday, 24 = Sunday
const mon = new Date(2026, 4, 18);
const tue = new Date(2026, 4, 19);
const fri = new Date(2026, 4, 22);
const sat = new Date(2026, 4, 23);
const sun = new Date(2026, 4, 24);
const nextMon = new Date(2026, 4, 25);

describe("isBusinessDay", () => {
  it("Monday is a business day", () => expect(isBusinessDay(mon)).toBe(true));
  it("Friday is a business day", () => expect(isBusinessDay(fri)).toBe(true));
  it("Saturday is not", () => expect(isBusinessDay(sat)).toBe(false));
  it("Sunday is not", () => expect(isBusinessDay(sun)).toBe(false));

  it("honors custom weekends (Friday-Saturday)", () => {
    expect(isBusinessDay(fri, { weekends: [5, 6] })).toBe(false);
    expect(isBusinessDay(sun, { weekends: [5, 6] })).toBe(true);
  });

  it("honors holiday list (Date)", () => {
    expect(isBusinessDay(mon, { holidays: [mon] })).toBe(false);
  });
  it("honors holiday list (string)", () => {
    expect(isBusinessDay(mon, { holidays: ["2026-05-18"] })).toBe(false);
    expect(isBusinessDay(mon, { holidays: ["2026-5-18"] })).toBe(false); // unpadded
  });
  it("honors holiday predicate", () => {
    expect(isBusinessDay(mon, { holidays: (d) => d.getDay() === 1 })).toBe(false);
  });
});

describe("addBusinessDays", () => {
  it("Mon + 1 = Tue", () => {
    expect(addBusinessDays(mon, 1).getDate()).toBe(19);
  });
  it("Fri + 1 = next Mon (skips weekend)", () => {
    expect(addBusinessDays(fri, 1).getDate()).toBe(25);
  });
  it("Mon + 5 = next Mon", () => {
    expect(addBusinessDays(mon, 5).getDate()).toBe(25);
  });
  it("preserves time-of-day", () => {
    const d = new Date(2026, 4, 18, 9, 30, 15);
    const r = addBusinessDays(d, 1);
    expect(r.getHours()).toBe(9);
    expect(r.getMinutes()).toBe(30);
    expect(r.getSeconds()).toBe(15);
  });
  it("skips holidays", () => {
    const r = addBusinessDays(mon, 1, { holidays: [tue] });
    expect(r.getDate()).toBe(20); // skip Tue, land on Wed
  });
  it("n=0 returns clone of input", () => {
    const r = addBusinessDays(mon, 0);
    expect(r.getTime()).toBe(mon.getTime());
    expect(r).not.toBe(mon);
  });
  it("rejects non-integer n", () => {
    expect(() => addBusinessDays(mon, 1.5)).toThrow();
  });
});

describe("subBusinessDays", () => {
  it("Mon - 1 = previous Fri", () => {
    const r = subBusinessDays(mon, 1);
    expect(r.getDate()).toBe(15);
  });
});

describe("businessDaysBetween", () => {
  it("same date → 0", () => {
    expect(businessDaysBetween(mon, mon)).toBe(0);
  });
  it("Mon → Fri = 4", () => {
    expect(businessDaysBetween(mon, fri)).toBe(4);
  });
  it("Mon → next Mon = 5", () => {
    expect(businessDaysBetween(mon, nextMon)).toBe(5);
  });
  it("negative when reversed", () => {
    expect(businessDaysBetween(fri, mon)).toBe(-4);
  });
  it("Mon → Sat = 4 (Sat doesn't count)", () => {
    expect(businessDaysBetween(mon, sat)).toBe(4);
  });
  it("excludes holidays", () => {
    expect(businessDaysBetween(mon, fri, { holidays: ["2026-05-20"] })).toBe(3);
  });
});

describe("nextBusinessDay", () => {
  it("returns same date if already business", () => {
    const r = nextBusinessDay(mon);
    expect(r.getDate()).toBe(18);
  });
  it("rolls Sat forward to Mon", () => {
    expect(nextBusinessDay(sat).getDate()).toBe(25);
  });
  it("rolls Sun backward to Fri", () => {
    expect(nextBusinessDay(sun, { direction: -1 }).getDate()).toBe(22);
  });
  it("skips holiday plus weekend", () => {
    // Holiday on Mon → roll to Tue
    expect(nextBusinessDay(mon, { holidays: ["2026-05-18"] }).getDate()).toBe(19);
  });
});
