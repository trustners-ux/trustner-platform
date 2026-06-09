# SIF NAV Data — Vendor & Source Options for MeraSIF

**Prepared for:** Trustner Asset Services (ARN-286886)
**Purpose:** Decide how to feed *daily, official* SIF NAVs into `sif-nav.php` so the fund table and charts go fully automatic.
**Date:** 9 June 2026

---

## The situation (why this note exists)

SIFs are an ~8-month-old SEBI category. Verified three ways from the server on 8–9 Jun 2026:

- **AMFI's public daily feed** (`NAVAll.txt`, 17,510 schemes) contains **zero** SIF schemes.
- **mfapi.in** (the free AMFI mirror) returns **zero** hits for "long short", "SIF", "iSIF", "Altiva", etc. (control queries work: Edelweiss 15 schemes, ICICI 15 — so the API is fine, SIFs simply aren't in it).

So there is **no free, structured, official SIF NAV feed today.** SIF NAVs currently live on (a) each AMC's website, (b) SEBI-mandated bi-monthly disclosures, and (c) a handful of commercial data platforms that have started covering the category. The options below are the realistic ways to get a clean daily feed.

> Our engine (`sif-nav.php`) already has the hook: fill a fund's `schemeCode` in `sif-nav-data.json` and it auto-pulls official NAV + full history. The only question is **which source supplies that data.**

---

## The options, ranked for Trustner

| # | Source | SIF coverage | Access / API | Indicative cost | Best for |
|---|--------|--------------|--------------|-----------------|----------|
| 1 | **CAMS / KFintech (RTA feeds)** | Growing — RTAs hold the official record for the schemes they service | Distributor NAV/transaction feed (often FTP/file or API) you may already be entitled to as an empanelled MFD | **Low / often included** in your distributor relationship | ✅ **Start here** — cheapest legitimate path |
| 2 | **Value Research — data licensing** | **Yes** — public SIF screener live at valueresearchonline.com/sif-screener (NAV, returns, risk band, TER) | VR Premium (manual) or a B2B data-feed licence (API/file) | **Mid** (₹, low-to-mid five figures/yr range — confirm with VR) | Clean, consolidated, India-focused single feed |
| 3 | **Morningstar India — Direct / Data API** | **Yes** — Morningstar already powers SIFPrime ("Morningstar + BSE" execution platform) | Institutional data licence / API | **High** (institutional pricing) | If you want institutional-grade, audited data + analytics |
| 4 | **ICRA Analytics — MFI Explorer (Accord Fintech)** | Likely / adding — the standard MF data tool for Indian distributors | Subscription + export/API | **Mid** | Distributors already using MFI Explorer for MF data |
| 5 | **AMC websites (direct)** | Yes, per fund — each AMC publishes its own SIF NAV | Manual or per-AMC scrape (varies wildly, often JS-rendered) | Free, but **fragile & high-maintenance** (13+ different layouts) | Stopgap for 2–3 priority funds only |
| 6 | **Free aggregators** (VR screener page, sifmf.in, SIF360) | Yes | No formal API/SLA; JS-rendered → needs a headless scraper | Free | Manual reference / spot-checks, **not** a production feed |
| 7 | **NSE / BSE** | Only **listed / interval** SIFs | Exchange feeds | Low | Niche — most open-ended SIFs aren't listed |

---

## Recommendation

**Phase 1 — now (cheapest, fastest):**
Ask your **CAMS and KFintech** distributor desks whether your existing NAV feed already carries SIF schemes (many RTA feeds do, since the RTA services the AMC's SIFs). If yes, we map each fund's RTA scheme code into `sif-nav-data.json` → **fully automatic at ~no extra cost.** This is almost certainly your lowest-friction route as an AMFI MFD.

**Phase 2 — if RTA coverage is partial:**
License the **Value Research** SIF data feed. They already maintain the full SIF list publicly, so coverage is proven; a B2B feed gives a single clean daily file/API for all funds. We point `sif-nav.php` at it once.

**Phase 3 — only if you want institutional-grade:**
**Morningstar India** Direct/Data. Highest quality and what the leading SIF platform (SIFPrime) uses, but the priciest. Worth it only if SIF becomes a core revenue line and you want audited data + ratings.

**Avoid as a primary feed:** per-AMC scraping (option 5/6). It looks free but breaks constantly across 13+ AMC layouts and creates ongoing maintenance you don't want on a compliance-sensitive page.

---

## What I need from you to wire any of these

For each fund, the source's **scheme code / identifier for the Regular-Growth plan**. Drop it into `sif-nav-data.json` (`"schemeCode": "..."`). That's it — the engine does the rest (pulls NAV + history, computes 1D/5D/1M/3M/SI, draws the charts, flips the green "live" dot).

If a source gives a **file/API** instead of per-scheme codes, I'll adapt `sif-nav.php`'s fetch function (one small change) to read that feed directly.

---

## Cost reality check

- **₹0–low:** RTA feed you already have (Phase 1). **← try this first.**
- **Low-to-mid five figures/yr:** Value Research data licence.
- **High (institutional):** Morningstar.
- All figures indicative — get written quotes; SIF-specific pricing is new and negotiable while the category is young.

*Sources consulted: Value Research SIF screener (valueresearchonline.com/sif-screener), SIFPrime ("Morningstar + BSE" platform), AMFI NAVAll.txt + mfapi.in probes run from the MeraSIF server on 8–9 Jun 2026.*
