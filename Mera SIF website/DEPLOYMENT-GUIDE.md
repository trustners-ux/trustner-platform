# Mera SIF — Deployment Guide

Everything you need to take merasif.com from staging-ready to live, indexed, and findable. Follow in order.

---

## ✅ Already done

- [x] All 10 HTML pages built and verified
- [x] Shared CSS + JS, sitemap.xml, robots.txt, deployment zip
- [x] Email updated to `wecare@trustner.in` across all pages
- [x] Phone aligned with merasip.com (+91 60039 03737)
- [x] All disclaimers identical to merasip.com (AMFI ARN, SEBI risk warning, MFD/Regular Plan, KYC, Grievance/SCORES)
- [x] merasif.com added as a website on Hostinger Cloud Professional
- [x] **mysif.in → https://www.merasif.com 301 redirect** (Permanent, set up via Hostinger Domains → mysif.in → DNS / Nameservers → Redirects)
- [x] **Hostinger cache cleared** (server-side, CDN, caching plugin) — confirmed "Cache cleaned successfully"
- [x] **Google verification TXT record added** to merasif.com DNS — `google-site-verification=y4vg2kpXp-DP0-MmXoPKElY0A3CRELN3SuhR` (confirmed propagated via 8.8.8.8 and 1.1.1.1)
- [x] **Google Search Console property created**: `https://www.merasif.com/` (URL prefix) — **VERIFIED via HTML file method** ✓
- [x] **Verification file `google169d6a49d54da15b.html`** created in `/public_html/` (HTTP 200, content correct)
- [x] **`sitemap.xml`** created in `/public_html/` (HTTP 200, valid XML, 1811 bytes, 10 URLs)
- [x] **Sitemap submitted to Google Search Console** — status: **Sitemap processed successfully**, 10 pages discovered, last read 07/05/2026

---

## ⏳ Final steps you need to do

### Step 1 — Upload the deployment zip (≈30 seconds)

The Hostinger File Manager is open in your second Chrome tab at `/public_html/`. The deployment zip is at:

```
/Users/ram/Documents/Trustner Tech Project/Mera SIF website/merasif-com-deployment.zip
```

(Finder is already open at this folder.)

**Action:**
1. Drag `merasif-com-deployment.zip` from Finder onto the empty area of the File Manager view (the area below the file list, not over a file). Wait ~10 seconds for upload.
2. *Alternative:* Click the upload icon (top-right ↑) → File → select the zip from the dialog.

### Step 2 — Extract the zip (≈5 seconds)

1. Right-click the uploaded `merasif-com-deployment.zip`
2. Select **Extract**
3. Confirm — files unpack into `/public_html/`

### Step 3 — Delete the placeholder (≈3 seconds)

1. Right-click `default.php` (the Hostinger placeholder, 15.99 KiB)
2. Select **Delete** / **Move to Trash**

This is critical — Apache will serve `default.php` instead of `index.html` if both exist.

### Step 4 — Clear cache (≈3 seconds)

1. Switch back to the first Hostinger tab (Dashboard)
2. Click **Clear cache** in the top-right of the Dashboard panel

### Step 5 — Verify (≈30 seconds)

Visit each in a new tab:
- https://www.merasif.com — home page should load with hero, AUM stats, comparison table
- https://www.merasif.com/what-is-sif.html — regulatory primer
- https://www.merasif.com/fund-universe.html — tab navigation should work
- https://www.merasif.com/contact.html — form should pre-fill WhatsApp on submit

If anything looks stale, hit **Clear cache** again — Hostinger caches aggressively on first publish.

### Step 6 — Test the mysif.in redirect (≈10 seconds)

After ~1 hour: visit https://mysif.in. It should 301-redirect to https://www.merasif.com.

---

## 🌐 SEO setup — **Search Console verification + sitemap**

You now have **two Search Console properties** saved (both pending verification, both will work after the deployment zip is uploaded):

| Property type | URL | Verification method | Token / file |
|---|---|---|---|
| Domain | `merasif.com` | DNS TXT record | `google-site-verification=y4vg2kpXp-DP0-MmXoPKElY0A3CRELN3SuhR` (already in DNS, globally propagated) |
| URL prefix | `https://www.merasif.com/` | HTML file | `google169d6a49d54da15b.html` (already in deployment zip) |

The HTML file method (URL prefix) is the **fastest path** — it works the moment the file is on the server.

### A) Verify via HTML file (recommended, ≈30 seconds AFTER deployment)

1. **Make sure the deployment zip has been uploaded and extracted to `/public_html/`** (the file `google169d6a49d54da15b.html` must be at the website root). It's bundled in the latest `merasif-com-deployment.zip` — just re-upload if you uploaded an earlier version.
2. Test the file is reachable: open https://www.merasif.com/google169d6a49d54da15b.html in a browser. You should see one line: `google-site-verification: google169d6a49d54da15b.html`.
3. Open https://search.google.com/search-console
4. Click the property dropdown (top-left) → select **https://www.merasif.com/**
5. Click **Verify** in the banner / dialog
6. ✅ Success in 1–2 seconds

### B) Verify via DNS (fallback if for some reason A doesn't work)

The DNS TXT record is already in place and globally propagated. Google's internal verifier just had a sticky cache when we tried earlier. It typically clears within 30-60 minutes from the first attempt.

1. Open https://search.google.com/search-console
2. Click the property dropdown → select **merasif.com** (the Domain property)
3. Click **Verify** in the banner
4. ✅ Should succeed within seconds, once Google's verifier cache has expired

If for some reason both still fail beyond 24 hours, ping support@hostinger.com to confirm the TXT record is being served correctly from authoritative nameservers.

### C) Submit the sitemap (≈10 seconds, after EITHER verification succeeds)

1. In Search Console, click the verified property
2. Left sidebar → **Sitemaps**
3. In the "Add a new sitemap" field, enter: `sitemap.xml` (just the filename — Search Console will resolve it to `https://www.merasif.com/sitemap.xml`)
4. Click **Submit**
5. Status should show "Success" within a few seconds; first indexing pass typically happens within 24-48 hours

### D) Bonus — Bing Webmaster Tools (5 min)

1. https://www.bing.com/webmasters
2. Add `https://www.merasif.com`
3. Verify (Bing accepts a Google Search Console import — fastest method, one click)
4. Submit `https://www.merasif.com/sitemap.xml`

### B) Submit the sitemap (≈10 seconds, after verification succeeds)

1. In Search Console, click the verified **merasif.com** property
2. Left sidebar → **Sitemaps**
3. In the "Add a new sitemap" field, enter: `sitemap.xml` (just the filename — Search Console will resolve it to `https://www.merasif.com/sitemap.xml`)
4. Click **Submit**
5. Status should show "Success" within a few seconds; first indexing pass typically happens within 24-48 hours

### C) Bonus — Bing Webmaster Tools (5 min)

1. https://www.bing.com/webmasters
2. Add `https://www.merasif.com`
3. Verify (Bing accepts a Google Search Console import — fastest method, one click)
4. Submit `https://www.merasif.com/sitemap.xml`

### D) Optional — Google Business Profile

If you want MeraSIF to surface on Google Maps when someone searches "SIF advisor Guwahati" / "SIF distributor Bangalore":
1. https://www.google.com/business
2. Use the same Trustner Group registered address
3. Category: "Financial Consultant" or "Investment Service"

### Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters
2. Add `https://www.merasif.com`
3. Verify (Bing accepts a Google Search Console import — fastest method)
4. Submit `https://www.merasif.com/sitemap.xml`

### Google Business Profile (optional but recommended)

If you want MeraSIF to surface on Google Maps when someone searches "SIF advisor Guwahati" / "SIF distributor Bangalore":
1. https://www.google.com/business
2. Use the same Trustner Group registered address
3. Category: "Financial Consultant" or "Investment Service"

---

## 📈 Analytics setup

### Google Analytics 4 (recommended)

1. Go to https://analytics.google.com
2. Create a property for `merasif.com`
3. Get the GA4 measurement ID (looks like `G-XXXXXXXXXX`)
4. Open `/Users/ram/Documents/Trustner Tech Project/Mera SIF website/index.html` (and all other HTML files)
5. Add this snippet just before `</head>` on each page:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Easiest way: replace `G-XXXXXXXXXX` with your real ID, then use VS Code or a similar editor to find/replace `</head>` with `[snippet]\n</head>` across all 10 HTML files. Re-zip and re-deploy.

### Hostinger built-in analytics

Already running on the website. Visit Dashboard → Analytics for visitor count, traffic sources, top pages. No setup required.

---

## 🚀 Launch the announcements

See `LAUNCH-ANNOUNCEMENTS.md` (in this same folder) for ready-to-use copy across:
- Email (to existing client base)
- WhatsApp (broadcast + 1:1 + lead-followup)
- LinkedIn (firm + founder posts)
- Twitter/X (5-tweet thread)
- Press release (150 words)
- Suggested 4-week launch sequence

---

## 🔧 Maintenance & updates

### How to update content
1. Edit the relevant `.html` file in `/Users/ram/Documents/Trustner Tech Project/Mera SIF website/`
2. Re-zip with all files: 
   ```
   cd "/Users/ram/Documents/Trustner Tech Project/Mera SIF website"
   rm -f merasif-com-deployment.zip
   zip -rq merasif-com-deployment.zip *.html assets/ sitemap.xml robots.txt
   ```
3. Upload the new zip via File Manager → Extract (overwrites existing)
4. Clear Hostinger cache

### Content refresh cadence
- **Fund Universe** page → refresh **monthly** with latest AMFI AUM data + new NFO launches
- **Industry stats** on home page → refresh **quarterly** with new AMFI quarterly data
- **Tax pages** → refresh after every Union Budget (typically February)
- **Regulatory primer** → refresh whenever SEBI issues new SIF circulars

### Common operational tweaks
- **Add a new page**: copy any existing `.html` file, replace content, add to sitemap.xml, link from navbar in all pages
- **Update phone/email**: the values are in the top-bar, navbar, footer, and contact methods of each page. Use a global find/replace across all 10 HTML files.
- **Change brand colour**: edit `assets/css/styles.css`, the `:root` CSS variables (`--royal`, `--cyan`, `--navy`)

---

## 🛡️ Security

Hostinger Cloud Professional includes:
- Free SSL (Let's Encrypt) — already active on merasif.com
- DDoS protection
- Daily backups (visible on Dashboard)
- Malware scanner — already active

**You don't need to set up anything additional for a static HTML site.**

---

## 📞 Support contacts

- **Hostinger Support**: 24/7 live chat from hPanel (top-right "Ask Kodee" button)
- **AMFI ARN issues**: support@amfiindia.com
- **Domain registrar issues**: domain@hostinger.com

---

*Last updated: May 2026. Update this file as the site evolves.*
