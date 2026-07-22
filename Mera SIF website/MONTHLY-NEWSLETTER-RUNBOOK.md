# MeraSIF Monthly — Newsletter Runbook

**Who runs this:** the scheduled cloud agent `merasif-monthly-newsletter` (15th of every month) — or any Claude session asked to "publish this month's newsletter".
**What it produces:** one new edition page `newsletter-YYYY-MM.html`, an updated hub `newsletter.html`, an updated `sitemap.xml`, and (when Chrome is available) a shareable PDF.

---

## Non-negotiable rules (same as the whole site)

1. **No fabricated data — ever.** Every figure must come from (a) the live NAV engine, (b) the site's own news archive, or (c) an external source you actually fetched and read. If a number can't be verified, OMIT it. Never estimate, never extrapolate, never "roughly".
2. **Distributor, not advisor.** Trustner is an AMFI-registered MFD & SIF distributor. Never use "advisor/adviser" for Trustner or its staff; never write personalised buy/sell recommendations. Frame everything as education and factual record. Performance is historical, "not indicative of future returns".
3. **The deploy hook cannot write .php files** — by design. Everything the newsletter needs is html/json/pdf/xml, all allowed.

## Cadence & naming

- Publish on the **15th of each month** (the agent's cron). Edition covers roughly the 30 days ending on publish day.
- Edition file: `newsletter-YYYY-MM.html` (ROOT level — the deploy hook cannot create directories, so newsletter files live at the web root) (e.g. `newsletter-2026-08.html`). PDF: `MeraSIF-Monthly-<Month>-<Year>.pdf`.
- Edition number increments by 1 (Edition No. 1 = July 2026).

## Step 1 — Gather real data

```bash
curl -s https://www.merasif.com/sif-nav.php > /tmp/nav.json        # official AMFI NAVs, all funds
curl -s https://www.merasif.com/sif-news.php > /tmp/news.json      # latest 60 headlines
curl -s https://www.merasif.com/sif-news-archive.json > /tmp/arch.json  # rolling archive (150)
```

From `/tmp/nav.json` (`funds` is a dict keyed by slug; fields: name, amc, cat, nav, navDate, d1, d5, m1, m3, si, aum, risk, ter, sd) compute with Python (never by eye):
- fund count, distinct AMC count, total AUM (sum of non-null `aum`, note how many funds report it)
- top 5 / bottom 5 by `m1` (only funds where m1 is not null), count positive vs measurable, median m1
- funds new since the last edition (compare against the previous edition's fund list, or `?newfunds`)
- `navAsOf` date — quote it everywhere performance appears.

From the news JSONs: items in the window, top ~10 by significance (regulatory > launches > flows > analysis), deduped. The "why it matters" line must be derivable from the headline — no invented outcomes.

**External research (optional but encouraged):** WebSearch for SIF developments in the window (SEBI/AMFI circulars, launches, AUM milestones). Every claim must be verified by actually fetching a source that supports it. Drop anything unverifiable. Cite source name + date in the copy.

## Step 2 — Build the edition

- Copy the previous edition (e.g. `newsletter-2026-07.html`) as the template — it contains `<!-- SLOT:xxx -->` comments marking every data-driven region:
  - `SLOT:cover-stats` (funds / AMCs / AUM / NAV-as-of), `SLOT:month-in-numbers`, `SLOT:performance-tables`, `SLOT:new-funds`, `SLOT:regulatory`, `SLOT:news-digest`, `SLOT:essay`, `SLOT:watch`
- Update title/description/canonical/OG tags + BreadcrumbList to the new month. Keep the compliance footer INTACT.
- **The essay:** one educational theme per edition (category mechanics, taxation, liquidity structures, risk bands, how long-short works, etc.). Education only; source any regulatory fact from SEBI/AMFI or existing site pages. When in doubt, leave analysis for the owner-approval digest instead of publishing.
- Update the hub `newsletter.html`: prepend a new edition card between `<!-- EDITIONS:START -->` and the first existing card. Keep summaries factual.
- Add the new edition URL to `sitemap.xml` (fetch live, insert `<url>`, redeploy).

## Step 3 — PDF (best-effort)

If headless Chrome is available:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="MeraSIF-Monthly-<Month>-<Year>.pdf" \
  "file://<abs-path>/newsletter-YYYY-MM.html"
```
If not available (cloud agent), skip the PDF, publish HTML only, and note it in the owner digest.

## Step 4 — Deploy (hook, token-gated)

```bash
TOKEN="msif_9f04931baa95d9e1fcf635d55ae938f684c92248cbd714a6"
for f in "newsletter-YYYY-MM.html" "newsletter.html" "sitemap.xml" "<pdf-name>.pdf"; do
  curl -s -X POST --data-binary @"$f" "https://www.merasif.com/sif-sync.php?t=$TOKEN&f=$f"
done
```
Expect `written-<bytes>-<path>` for each. Then verify live:
- `curl -s https://www.merasif.com/newsletter-YYYY-MM.html | grep -c "Edition No."` → ≥1
- hub lists the new edition; sitemap contains the URL; every number spot-checked against `/tmp/nav.json`.

## Step 5 — Owner digest (always)

Send the owner a short summary: edition URL, the headline numbers used, list of external claims included (each with its source), anything dropped as unverifiable, and anything needing approval. Publishing mode per owner decision: **facts auto-publish; new analysis/opinion beyond the education templates needs owner approval before it goes in.**

## Step 6 — Git

From the repo root (`/Users/ram/Documents/Trustner Tech Project`): commit the new/changed files under `Mera SIF website/` with message `Newsletter: <Month> <Year> edition` and push to origin main (when running locally with push access).
