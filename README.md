# business-days

[![ci](https://github.com/p-vbordei/business-days/actions/workflows/ci.yml/badge.svg)](https://github.com/p-vbordei/business-days/actions/workflows/ci.yml)

[![npm](https://img.shields.io/npm/v/%40p-vbordei%2Fbusiness-days.svg)](https://www.npmjs.com/package/@p-vbordei/business-days)
[![downloads](https://img.shields.io/npm/dm/%40p-vbordei%2Fbusiness-days.svg)](https://www.npmjs.com/package/@p-vbordei/business-days)
[![bundle](https://img.shields.io/bundlejs/size/%40p-vbordei%2Fbusiness-days)](https://bundlejs.com/?q=%40p-vbordei%2Fbusiness-days)

> Add and subtract working days, count business days between two dates, with configurable weekends and holidays. Zero dependencies. Works with the built-in `Date` — no date-fns, no Day.js.

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

Works with Node 20+, browsers, Bun, Deno. ESM + CJS.

## Why

"Add 3 business days to today" sounds simple. Then you need to skip weekends. Then holidays. Then it turns out your Middle East team works Sunday–Thursday. Then someone wants "the last business day of the quarter".

Most date libraries either don't have this at all, or it's bolted on with assumptions about US holidays baked in. `business-days` makes the rules explicit:

- **You bring the weekends** (default `[0, 6]` = Sat+Sun).
- **You bring the holidays** (Date list, ISO date strings, or a predicate function).
- No timezone fiddling — all functions operate on local-time year/month/day, preserving the input's time-of-day component.

## Recipes

### "Pay by Net 30 business days"

```ts
import { addBusinessDays } from "@p-vbordei/business-days";

const dueDate = addBusinessDays(invoice.issuedAt, 30, {
  holidays: usHolidays(invoice.issuedAt.getFullYear()),
});
```

### SLA deadline tracker

```ts
import { addBusinessDays, businessDaysBetween } from "@p-vbordei/business-days";

const slaDeadline = addBusinessDays(ticket.openedAt, 3);
const daysOver = Math.max(0, businessDaysBetween(slaDeadline, new Date()));
if (daysOver > 0) escalate(ticket, daysOver);
```

### Custom weekend rules (Middle East)

```ts
import { isBusinessDay, addBusinessDays } from "@p-vbordei/business-days";

const middleEast = { weekends: [5, 6] };  // Fri + Sat off

isBusinessDay(thursday, middleEast);      // true
addBusinessDays(wednesday, 1, middleEast);  // next workday is Sunday
```

### Dynamic holiday predicate (every Christmas)

```ts
import { addBusinessDays } from "@p-vbordei/business-days";

const isChristmas = (d: Date) => d.getMonth() === 11 && d.getDate() === 25;
addBusinessDays(today, 5, { holidays: isChristmas });
```

### Days remaining to a deadline

```ts
import { businessDaysBetween } from "@p-vbordei/business-days";

const remaining = businessDaysBetween(new Date(), deadline);
if (remaining < 3) sendReminder();
```

### "Roll forward to next business day if today isn't one"

```ts
import { nextBusinessDay } from "@p-vbordei/business-days";

const dispatchDate = nextBusinessDay(order.requestedDate, {
  holidays: holidayList,
});
```

## API

All functions accept an `opts` object:

| Option | Type | Default | Meaning |
|---|---|---|---|
| `weekends` | `number[]` (0=Sun..6=Sat) | `[0, 6]` | Days treated as weekend |
| `holidays` | `Date[] \| string[]` (`YYYY-MM-DD`) **or** `(d: Date) => boolean` | none | Additional non-working days |

### `isBusinessDay(date, opts?): boolean`

### `addBusinessDays(date, n, opts?): Date`

`n` may be negative; throws on non-integers. Preserves time-of-day. Returns a new `Date` — never mutates.

### `subBusinessDays(date, n, opts?): Date`

Sugar for `addBusinessDays(date, -n)`.

### `businessDaysBetween(from, to, opts?): number`

Counts business days in the half-open interval `(min, max]`, signed by direction:

```ts
businessDaysBetween(monday, friday);   //  4
businessDaysBetween(friday, monday);   // -4
businessDaysBetween(monday, monday);   //  0
```

Symmetry holds: `businessDaysBetween(a, b) + businessDaysBetween(b, a) === 0` always (verified by property-based tests).

### `nextBusinessDay(date, opts?): Date`

Returns `date` unchanged if it's already a business day, otherwise rolls forward (or backward with `direction: -1`) until it hits one.

```ts
nextBusinessDay(saturday);                   // → next Monday
nextBusinessDay(sunday, { direction: -1 });  // → previous Friday
```

## Holiday formats

- **Date array**: `[new Date(2026, 11, 25)]` — compared by local year/month/day.
- **String array**: `["2026-12-25"]` — ISO-like `YYYY-MM-DD` or unpadded `YYYY-M-D`. Interpreted in local time.
- **Predicate**: `(d) => isChristmas(d)` — useful for "every Christmas" or "all of August".

```ts
{ holidays: [new Date(2026, 11, 25)] }
{ holidays: ["2026-12-25"] }
{ holidays: (d) => d.getMonth() === 11 && d.getDate() === 25 }
```

## Caveats

- **Local time only.** If you need to anchor holidays to a specific timezone different from the runtime's, construct `Date` objects in that timezone yourself (or use [tz-clock](https://github.com/p-vbordei/tz-clock)).
- **No built-in holiday tables.** Bring your own — too much variation across jurisdictions to ship reasonably.

## License

Apache-2.0 © Vlad Bordei
