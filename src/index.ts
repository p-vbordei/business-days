export type HolidayInput =
  | Iterable<Date | string>
  | ((d: Date) => boolean);

export interface BusinessDayOptions {
  /**
   * Day-of-week numbers that count as weekend (0 = Sunday ... 6 = Saturday).
   * Default `[0, 6]` (Sat + Sun).
   */
  weekends?: readonly number[];
  /**
   * Holidays excluded in addition to weekends. Either:
   *  - an iterable of `Date` objects or ISO-like `YYYY-MM-DD` strings, or
   *  - a predicate `(date) => boolean` for dynamic holiday rules.
   *
   * Strings/Dates are compared by local-time year/month/day.
   */
  holidays?: HolidayInput;
}

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildHolidaySet(input: HolidayInput | undefined): Set<string> | ((d: Date) => boolean) | null {
  if (!input) return null;
  if (typeof input === "function") return input;
  const out = new Set<string>();
  for (const h of input) {
    if (h instanceof Date) out.add(keyOf(h));
    else if (typeof h === "string") {
      // Normalize "2026-1-1" → "2026-01-01"
      const m = h.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m) out.add(`${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`);
      else throw new Error(`unrecognized holiday string: ${h}`);
    }
  }
  return out;
}

function isHolidayFn(d: Date, h: Set<string> | ((x: Date) => boolean) | null): boolean {
  if (!h) return false;
  if (typeof h === "function") return h(d);
  return h.has(keyOf(d));
}

/**
 * `true` if `d` is a working day under the supplied weekend + holiday rules.
 */
export function isBusinessDay(d: Date, opts: BusinessDayOptions = {}): boolean {
  const weekends = opts.weekends ?? [0, 6];
  if (weekends.includes(d.getDay())) return false;
  return !isHolidayFn(d, buildHolidaySet(opts.holidays));
}

/**
 * Add `n` business days to `d`. `n` may be negative.
 * Returns a new Date; never mutates the input. Time-of-day is preserved.
 */
export function addBusinessDays(d: Date, n: number, opts: BusinessDayOptions = {}): Date {
  if (!Number.isInteger(n)) throw new Error("n must be an integer");
  const weekends = opts.weekends ?? [0, 6];
  const holidays = buildHolidaySet(opts.holidays);
  const result = new Date(d.getTime());
  if (n === 0) return result;
  const step = n > 0 ? 1 : -1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    result.setDate(result.getDate() + step);
    if (!weekends.includes(result.getDay()) && !isHolidayFn(result, holidays)) {
      remaining--;
    }
  }
  return result;
}

/** Sugar for `addBusinessDays(d, -n)`. */
export function subBusinessDays(d: Date, n: number, opts: BusinessDayOptions = {}): Date {
  return addBusinessDays(d, -n, opts);
}

/**
 * Count business days in the half-open interval `(from, to]` (exclusive of `from`,
 * inclusive of `to`). Returns a negative number when `from > to`.
 *
 * So `businessDaysBetween(monday, friday)` is 4 (Tue, Wed, Thu, Fri).
 */
export function businessDaysBetween(from: Date, to: Date, opts: BusinessDayOptions = {}): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  if (a.getTime() === b.getTime()) return 0;
  const direction = a < b ? 1 : -1;
  const weekends = opts.weekends ?? [0, 6];
  const holidays = buildHolidaySet(opts.holidays);
  const cursor = new Date(a.getTime());
  let count = 0;
  while (cursor.getTime() !== b.getTime()) {
    cursor.setDate(cursor.getDate() + direction);
    if (!weekends.includes(cursor.getDay()) && !isHolidayFn(cursor, holidays)) {
      count += direction;
    }
  }
  return count;
}

/**
 * Move `d` to the next business day if it is not already one. Returns a new Date.
 * Use `direction: -1` to move backwards.
 */
export function nextBusinessDay(d: Date, opts: BusinessDayOptions & { direction?: 1 | -1 } = {}): Date {
  const result = new Date(d.getTime());
  if (isBusinessDay(result, opts)) return result;
  const step = opts.direction === -1 ? -1 : 1;
  while (!isBusinessDay(result, opts)) {
    result.setDate(result.getDate() + step);
  }
  return result;
}
