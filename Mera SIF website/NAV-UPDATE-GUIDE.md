# How to keep SIF NAVs current — MeraSIF update guide

**File you edit:** `sif-nav-data.json` (in the site root).
**No code, no deploy pipeline** — change a number, save, done. The engine (`sif-nav.php`) recomputes 1D/5D/1M/3M/SI and redraws every chart automatically.

> ⚠️ **Honesty note from the build:** the NAV figures currently in the file are the **illustrative working numbers from our research narrative**, not yet verified against official AMC factsheets. To make the table genuinely authoritative, replace them with **real NAVs** using the steps below. I deliberately did **not** invent additional month-end data points — on a SEBI-regulated distributor site, fabricated performance figures are a real compliance risk. Feed it real data and it's bulletproof.

---

## Where to get the real NAVs (Regular-Growth plan)

Pick whichever is easiest — all are legitimate:

1. **Value Research SIF screener** → https://www.valueresearchonline.com/sif-screener/ — shows every live SIF with NAV + returns. Fastest manual source.
2. **AMC factsheet / fund page** — e.g. ICICI Pru, Edelweiss (edelweissmf.com/altivasif), SBI, etc. The official primary source.
3. **Your RTA feed (CAMS / KFintech)** — if it carries SIFs, that's the daily automatic route (see `NAV-DATA-VENDORS.md`).

> Always use the **Regular Plan – Growth** NAV (not Direct). That's how Trustner is remunerated and what we display.

---

## Two-minute task: update today's NAVs

For each fund in `sif-nav-data.json`, set its `nav`, then set the one global `asOf` date at the top:

```json
"asOf": "2026-06-09",
"funds": {
  "altiva-hybrid": { ... "nav": 10.71, ... },
  "magnum-hybrid": { ... "nav": 10.38, ... },
  ...
}
```

Save. That's it. SI updates instantly; the new point joins each fund's history so 1D/5D fill in over the following days.

---

## Make 1M / 3M real *right now*: add month-end history points

Each fund has a `history` array. Add the **real** month-end NAVs you read off Value Research / the factsheet. Example (already done for Altiva using disclosed figures):

```json
"altiva-hybrid": {
  "name": "Altiva Hybrid Long-Short", "amc": "Edelweiss", "cat": "hybrid",
  "nav": 10.67, "aum": 2700, "schemeCode": null,
  "incept": "2025-10-22",
  "history": [
    { "d": "2026-02-28", "nav": 10.18 },
    { "d": "2026-04-15", "nav": 10.52 }
  ]
}
```

- `incept` → launch date; NAV is automatically ₹10 (face value) there.
- Add as many `{ "d": "YYYY-MM-DD", "nav": x.xx }` points as you have. More points = more return windows light up (a point ~30 days back ⇒ real 1M; ~90 days back ⇒ real 3M).
- The chart draws straight from these points. The engine picks the nearest point to each window and shows "—" if none is close enough (so it never misrepresents sparse data).

**Funds that still need month-end points** (currently inception + current only, so 1M/3M show "—"):
`isif-hybrid`, `dynasif-equity`, `apex-hybrid`, `arudha-hybrid`, `dynasif-aaa`, `qsif-hybrid`, `qsif-equity`, `diviniti`, `qsif-ex-top-100`, `qsif-aaa`, `titanium-equity`, `arudha-equity`, `sapphire`, `wsif-equity`, `wsif-ex-top-100`, `union-equity`.

Add 2–3 month-end NAVs to each from the VR screener and the whole board goes real.

---

## Make it fully automatic: set `schemeCode`

The instant a fund appears in a feed (AMFI, mfapi, or a vendor — see `NAV-DATA-VENDORS.md`), put its **Regular-Growth scheme code** in:

```json
"isif-hybrid": { ... "schemeCode": "152XXX", ... }
```

The engine then ignores the manual `nav`/`history` for that fund and pulls **official daily NAV + full history** from the feed — every return becomes exact and same-day, and a green "live" dot appears on the table and chart. No other change needed.

---

## After editing — how to publish

1. Open Hostinger File Manager → `public_html` → `sif-nav-data.json` → edit in the browser editor → save. **OR** send me the updated file / the numbers and I'll deploy it.
2. The cache refreshes within 12 hours automatically. To force it immediately, just ask me to bust the cache.

---

## Fastest path to "real across the board"

Paste me the **current NAV + 2 month-end NAVs** for each fund from the Value Research screener (one block of 20 lines is enough), and I'll populate `sif-nav-data.json` with verified data and deploy in one pass — every 1M/3M real, every chart accurate. ~15 minutes of copy-paste on your side; the rest is mine.
