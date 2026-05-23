AMC Logo Directory
==================

Drop square PNG or SVG logos here (64x64 minimum, transparent or white background).

File naming: kebab-case matching the slug used in src/lib/constants/company.ts
Examples:
  sbi.png, hdfc.png, icici-pru.png, nippon-india.png, kotak.png,
  absl.png, axis.png, uti.png, mirae-asset.png, dsp.png, tata.png,
  motilal-oswal.png, franklin.png, bandhan.png, canara-robeco.png,
  sundaram.png, hsbc.png, invesco.png, lic.png, baroda-bnp.png,
  quant.png, ppfas.png, edelweiss.png, pgim.png, mahindra-manulife.png,
  bajaj-finserv.png, union.png, jm-financial.png, iti.png, quantum.png,
  whiteoak.png, nj.png, samco.png, navi.png, groww.png,
  zerodha.png, helios.png, trust.png, 360-one.png, shriram.png,
  old-bridge.png, taurus.png

After dropping a file, add `logo: '/amcs/<slug>.png'` to the matching AMC entry
in src/lib/constants/company.ts. The component will auto-pick the logo and
fall back to the branded initial-circle if any file fails to load.
