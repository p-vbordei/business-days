# business-days

[![ci](https://github.com/p-vbordei/business-days/actions/workflows/ci.yml/badge.svg)](https://github.com/p-vbordei/business-days/actions/workflows/ci.yml)

Add and subtract working days, count business days between two dates, with configurable weekends and holidays. Zero dependencies. Works with the built-in `Date` — no date-fns, no Day.js.

```ts
import {
  isBusinessDay,
  addBusinessDays,
  subBusinessDays,
  businessDaysBetween,
  nextBusinessDay,
} from "@p-vbordei/business-days";

addBusinessDays(new Date(2026, 4, 22), 1);
// Friday + 1 → Monday (skips Sat+Sun)

addBusinessDays(today, 5, {
  holidays: ["2026-12-25", "2026-12-26"],
});

businessDaysBetween(monday, friday);   // 4

isBusinessDay(date, { weekends: [5, 6] });  // Fri-Sat weekend (e.g. Middle East)
```

## Install

```sh
npm install @p-vbordei/business-days
```

## API

All functions accept an `opts` object:

| Option | Type | Default | Meaning |
|---|---|---|---|
| `weekends` | `number[]` (0=Sun..6=Sat) | `[0, 6]` | Days treated as weekend |
| `holidays` | `Date[] \| string[]` (`YYYY-MM-DD`) **or** `(d: Date) => boolean` | none | Additional non-working days |

### Functions

- `isBusinessDay(date, opts?) → boolean`
- `addBusinessDays(date, n, opts?) → Date` — `n` may be negative; throws on non-integers
- `subBusinessDays(date, n, opts?) → Date` — sugar for `addBusinessDays(date, -n)`
- `businessDaysBetween(from, to, opts?) → number` — counts the half-open interval `(from, to]`; negative if reversed
- `nextBusinessDay(date, opts?) → Date` — rolls forward (or backward, with `direction: -1`) until the result is a business day

### Time-of-day

Functions preserve the time component of the input — `addBusinessDays(d, n)` only changes the calendar date, not the hours/minutes/seconds.

### Holidays as strings vs Date

Strings are interpreted in local time. `"2026-5-1"` and `"2026-05-01"` both work. If you need to anchor holidays to a specific timezone, pass `Date` objects you constructed in that timezone (or use the predicate form).

## License

Apache-2.0 © Vlad Bordei
