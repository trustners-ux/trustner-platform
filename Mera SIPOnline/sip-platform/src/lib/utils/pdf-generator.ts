import { jsPDF } from 'jspdf';

interface PDFOptions {
  elementId: string;
  title: string;
  fileName: string;
}

/**
 * Load the Trustner logo as a base64 data URL for embedding in PDF.
 * We fetch the public logo file and convert it to base64.
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/Trustner Logo-blue.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Create a white-version of the logo for use on dark header backgrounds.
 * Converts the blue logo to white by manipulating pixel data.
 */
async function createWhiteLogo(logoBase64: string): Promise<string | null> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoBase64;
    });

    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const pixels = imageData.data;

    // Convert all non-transparent pixels to white
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 30) {
        // Pixel has some opacity — make it white
        pixels[i] = 255;     // R
        pixels[i + 1] = 255; // G
        pixels[i + 2] = 255; // B
        // Keep alpha as-is for smooth edges
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Sanitize text for jsPDF — Helvetica doesn't support ₹ symbol.
 * Replace ₹ with Rs. for clean PDF rendering.
 */
function sanitizePdfText(text: string): string {
  return text.replace(/₹/g, 'Rs.').replace(/'/g, '');
}

/**
 * Scrape the input panel to extract plan parameters for the PDF summary box.
 * Returns structured data about base settings and events.
 */
function scrapePlanSummary(element: HTMLElement): {
  investorName: string;
  investorAge: string;
  baseSettings: { label: string; value: string }[];
  events: { type: string; color: 'green' | 'amber'; details: string[] }[];
  journeySummary: string;
  resultSummaries: { label: string; value: string; status?: 'positive' | 'negative' }[];
} {
  const inputPanel = element.children[0] as HTMLElement | null;
  if (!inputPanel) {
    return { investorName: '', investorAge: '', baseSettings: [], events: [], journeySummary: '', resultSummaries: [] };
  }

  // Extract investor name & age from PersonalInfoBar
  const nameInput = inputPanel.querySelector('input[placeholder*="e.g."]') as HTMLInputElement | null;
  const ageInput = inputPanel.querySelector('input[inputMode="decimal"]') as HTMLInputElement | null;
  const investorName = nameInput?.value || '';

  // Find age — look for the input after the "Current Age" or "Age" label
  let investorAge = '';
  const allLabels = inputPanel.querySelectorAll('label');
  allLabels.forEach((lbl) => {
    if (lbl.textContent?.toLowerCase().includes('age')) {
      const parentDiv = lbl.closest('div');
      if (parentDiv) {
        const ageInp = parentDiv.querySelector('input[inputMode="decimal"]') as HTMLInputElement | null;
        if (ageInp?.value) investorAge = ageInp.value;
      }
    }
  });

  // Extract base settings (Starting Corpus, Return Rate, Planning Horizon)
  const baseSettings: { label: string; value: string }[] = [];
  const baseSection = inputPanel.querySelector('.rounded-xl.border.bg-slate-50');
  if (baseSection) {
    // Lifeline-style: dedicated base settings container
    const labels = baseSection.querySelectorAll('label');
    labels.forEach((lbl) => {
      const wrapper = lbl.closest('div');
      if (!wrapper) return;
      const inp = wrapper.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (inp) {
        const prefix = wrapper.querySelector('.pl-3.pr-1')?.textContent || '';
        const suffix = wrapper.querySelector('.pr-2.text-sm')?.textContent || '';
        baseSettings.push({
          label: lbl.textContent || '',
          value: `${prefix}${inp.value}${suffix ? ' ' + suffix : ''}`,
        });
      }
    });
  } else {
    // Generic fallback: scrape all NumberInput labels & values from the input panel
    // This works for SWP, SIP, Lumpsum, Retirement, and all other simple calculators
    const allLabelEls = inputPanel.querySelectorAll('label');
    const seenLabels = new Set<string>();
    allLabelEls.forEach((lbl) => {
      const labelText = lbl.textContent?.trim() || '';
      // Skip name/age fields (already captured), empty labels, and toggle labels
      if (!labelText || seenLabels.has(labelText)) return;
      if (labelText.toLowerCase().includes('name') || labelText.toLowerCase().includes('age')) return;
      if (labelText.toLowerCase().includes('step-up') || labelText.toLowerCase().includes('annual increase')) return;

      // Find the closest wrapper div that contains both the label and input
      const wrapper = lbl.closest('div');
      if (!wrapper) return;
      const inp = wrapper.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (inp && inp.value) {
        const prefix = wrapper.querySelector('.pl-3.pr-1')?.textContent || '';
        const suffix = wrapper.querySelector('.pr-2.text-sm')?.textContent || '';
        seenLabels.add(labelText);
        baseSettings.push({
          label: labelText,
          value: `${prefix}${inp.value}${suffix ? ' ' + suffix : ''}`,
        });
      }
    });
  }

  // Step-up / increment toggle info is captured per-event below (not in baseSettings)

  // Extract events
  const events: { type: string; color: 'green' | 'amber'; details: string[] }[] = [];
  const eventCards = inputPanel.querySelectorAll('.rounded-xl.border.p-3, .rounded-xl.border.p-4');
  eventCards.forEach((card) => {
    const el = card as HTMLElement;
    // Skip the base settings section
    if (el.classList.contains('bg-slate-50')) return;

    const badge = el.querySelector('.rounded-full.text-\\[10px\\]');
    if (!badge) return;

    const typeName = badge.textContent?.trim() || '';
    const isWithdrawal = typeName.includes('SWP') || typeName.includes('Withdraw');
    const labelInput = el.querySelector('input[placeholder*="Label"]') as HTMLInputElement | null;
    const eventLabel = labelInput?.value || '';

    const details: string[] = [];
    if (eventLabel) details.push(`Label: ${eventLabel}`);

    // Get select value (Year)
    const select = el.querySelector('select') as HTMLSelectElement | null;
    if (select) {
      const selectedOption = select.options[select.selectedIndex];
      details.push(selectedOption?.text || '');
    }

    // Get all NumberInput values in this card
    const numberLabels = el.querySelectorAll('label.block');
    numberLabels.forEach((nLabel) => {
      const text = nLabel.textContent?.trim() || '';
      if (text.toLowerCase().includes('start year') || text.toLowerCase().includes('year')) return; // Already captured
      const parentDiv = nLabel.closest('div');
      if (!parentDiv) return;
      const inp = parentDiv.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (inp) {
        const prefix = parentDiv.querySelector('.pl-3.pr-1')?.textContent || '';
        const suffix = parentDiv.querySelector('.pr-2.text-sm')?.textContent || '';
        details.push(`${text}: ${prefix}${inp.value}${suffix ? ' ' + suffix : ''}`);
      }
    });

    // Capture step-up / increment toggle info from this event card
    const toggleSwitch = el.querySelector('[role="switch"][aria-checked="true"]');
    if (toggleSwitch) {
      const toggleSection = toggleSwitch.closest('.border-t');
      if (toggleSection) {
        // Find the active mode button (percentage vs amount) - works for both emerald (SIP) and amber (SWP)
        const activeBtn = toggleSection.querySelector('button.bg-emerald-500, button.bg-amber-500');
        const modeText = activeBtn?.textContent?.trim() || '';

        // Find the value input for the step-up
        const stepLabels = toggleSection.querySelectorAll('label');
        stepLabels.forEach((sl) => {
          const slText = sl.textContent?.trim() || '';
          if (slText.toLowerCase().includes('increase') || slText.toLowerCase().includes('step')) {
            const slWrapper = sl.closest('div');
            const slInp = slWrapper?.querySelector('input[type="text"]') as HTMLInputElement | null;
            if (slInp?.value) {
              const slPrefix = slWrapper?.querySelector('.pl-3.pr-1')?.textContent || '';
              const slSuffix = slWrapper?.querySelector('.pr-2.text-sm')?.textContent || '';
              const modeLabel = modeText === '+%' ? 'Percentage' : modeText === '+₹' ? 'Amount' : 'Annual';
              details.push(`Annual Step-Up (${modeLabel}): ${slPrefix}${slInp.value}${slSuffix ? ' ' + slSuffix : ''}`);
            }
          }
        });
      }
    }

    events.push({
      type: typeName,
      color: isWithdrawal ? 'amber' : 'green',
      details,
    });
  });

  // Extract result summary cards from the input panel (e.g., "Total Withdrawn", "Withdrawal Rate", etc.)
  const resultSummaries: { label: string; value: string; status?: 'positive' | 'negative' }[] = [];
  const statusCard = inputPanel.querySelector('.rounded-xl.p-4');
  if (statusCard) {
    const statusLabel = statusCard.querySelector('.text-\\[10px\\]')?.textContent?.trim() || '';
    const statusValue = statusCard.querySelector('.text-lg.font-extrabold')?.textContent?.trim() || '';
    const statusDetail = statusCard.querySelector('.text-xs')?.textContent?.trim() || '';
    if (statusValue) {
      const isPositive = statusCard.classList.contains('bg-teal-50') ||
        statusValue.toLowerCase().includes('sustainable');
      resultSummaries.push({
        label: statusLabel || 'Status',
        value: `${statusValue}${statusDetail ? ' — ' + statusDetail : ''}`,
        status: isPositive ? 'positive' : 'negative',
      });
    }
  }
  // Scrape the smaller result boxes (Total Withdrawn, Withdrawal Rate, Year 1 Monthly, etc.)
  const resultBoxes = inputPanel.querySelectorAll('.bg-surface-100.rounded-lg.p-3, .bg-amber-50.rounded-lg.p-3');
  resultBoxes.forEach((box) => {
    const label = box.querySelector('.text-\\[10px\\]')?.textContent?.trim() || '';
    const value = box.querySelector('.text-sm.font-bold')?.textContent?.trim() || '';
    if (label && value) {
      resultSummaries.push({ label, value });
    }
  });

  // Journey summary
  const journeyDiv = inputPanel.querySelector('.bg-gradient-to-r.from-emerald-50');
  const journeySummary = journeyDiv?.textContent?.replace(/\s+/g, ' ').trim() || '';

  return { investorName, investorAge, baseSettings, events, journeySummary, resultSummaries };
}

/**
 * Trim trailing whitespace rows from the bottom of a canvas.
 * Returns the Y position where actual content ends.
 */
function findContentBottom(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.height;

  const width = canvas.width;
  const height = canvas.height;

  // Sample from bottom up to find last row with non-white content
  const sampleWidth = Math.min(width, 400);
  const startX = Math.floor((width - sampleWidth) / 2);

  for (let y = height - 1; y > 0; y -= 2) {
    const imgData = ctx.getImageData(startX, y, sampleWidth, 1);
    const pixels = imgData.data;
    let hasContent = false;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 240 || pixels[i + 1] < 240 || pixels[i + 2] < 240) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      // Add a small buffer (20px) below the last content row
      return Math.min(y + 20, height);
    }
  }
  return height;
}

export async function generateCalculatorPDF({ elementId, title, fileName }: PDFOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // ─── Scrape input data BEFORE hiding the panel ───
  const planSummary = scrapePlanSummary(element);

  // Load logo and html2canvas in parallel
  const html2canvas = (await import('html2canvas-pro')).default;

  // ─── Save original styles ───
  const originalWidth = element.style.width;
  const originalMinWidth = element.style.minWidth;
  const originalGridCols = element.style.gridTemplateColumns;
  const originalDisplay = element.style.display;
  const originalGap = element.style.gap;

  // ─── HIDE the input panel entirely (we'll draw a compact summary via jsPDF) ───
  const inputPanel = element.children[0] as HTMLElement | null;
  const originalInputDisplay = inputPanel?.style.display ?? '';
  if (inputPanel) {
    inputPanel.style.display = 'none';
  }

  // Force single-column layout for the results panel only
  element.style.width = '900px';
  element.style.minWidth = '900px';
  element.style.display = 'block'; // Single column since input panel is hidden
  element.style.gap = '0px';

  // Hide download buttons during capture
  const downloadButtons = element.querySelectorAll('button');
  const hiddenButtons: { el: HTMLElement; display: string }[] = [];
  downloadButtons.forEach((btn) => {
    if (btn.textContent?.includes('Download PDF') || btn.textContent?.includes('Generating PDF')) {
      hiddenButtons.push({ el: btn, display: btn.style.display });
      btn.style.display = 'none';
    }
  });

  // ─── Replace <input> elements with styled <span> for clean PDF rendering ───
  const inputSwaps: { input: HTMLInputElement; placeholder: HTMLSpanElement }[] = [];
  element.querySelectorAll('input[type="text"], input[type="number"]').forEach((el) => {
    const input = el as HTMLInputElement;
    const computed = window.getComputedStyle(input);
    if (computed.display === 'none') return; // Skip hidden inputs
    const span = document.createElement('span');
    span.textContent = input.value;
    span.style.display = 'block';
    span.style.fontFamily = computed.fontFamily;
    span.style.fontSize = computed.fontSize;
    span.style.fontWeight = computed.fontWeight;
    span.style.color = computed.color;
    span.style.padding = computed.padding;
    span.style.lineHeight = computed.lineHeight;
    span.style.letterSpacing = computed.letterSpacing;
    span.style.minWidth = '0';
    span.style.flex = '1';
    span.style.whiteSpace = 'nowrap';
    input.parentNode?.insertBefore(span, input);
    input.style.display = 'none';
    inputSwaps.push({ input, placeholder: span });
  });

  // ─── Compact spacing for PDF: reduce paddings and margins ───
  const spacingOverrides: { el: HTMLElement; prop: string; original: string }[] = [];
  const compactifyRules: { selector: string; props: Record<string, string> }[] = [
    { selector: '.space-y-4', props: { gap: '6px' } },
    { selector: '.space-y-3', props: { gap: '4px' } },
    { selector: '.card-base', props: { padding: '10px' } },
    { selector: '.rounded-xl.border.p-4', props: { padding: '8px 10px' } },
    { selector: '.rounded-xl.border.p-3', props: { padding: '6px 8px' } },
    // Reduce chart heights for compact PDF
    { selector: '.h-80', props: { height: '220px' } },
    { selector: '.h-96', props: { height: '260px' } },
    // Compact summary cards grid
    { selector: '.grid.grid-cols-2.lg\\:grid-cols-4', props: { gap: '6px' } },
  ];

  compactifyRules.forEach(({ selector, props }) => {
    element.querySelectorAll(selector).forEach((child) => {
      const el = child as HTMLElement;
      Object.entries(props).forEach(([prop, val]) => {
        spacingOverrides.push({ el, prop, original: el.style.getPropertyValue(prop) });
        el.style.setProperty(prop, val);
      });
    });
  });

  // Compact space-y containers
  const spaceContainers: { el: HTMLElement; origDisplay: string; origFlexDir: string; origGap: string }[] = [];
  element.querySelectorAll('.space-y-8, .space-y-4, .space-y-3').forEach((child) => {
    const el = child as HTMLElement;
    const computed = window.getComputedStyle(el);
    spaceContainers.push({
      el,
      origDisplay: el.style.display,
      origFlexDir: el.style.flexDirection,
      origGap: el.style.gap,
    });
    if (computed.display !== 'flex') {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
    }
  });

  // ─── Hide "hint" text in PDF ───
  const hiddenHints: { el: HTMLElement; display: string }[] = [];
  element.querySelectorAll('[class*="text-slate-400"]').forEach((child) => {
    const el = child as HTMLElement;
    const text = el.textContent ?? '';
    if (el.tagName === 'P' && text.length < 80 && el.classList.contains('text-xs')) {
      hiddenHints.push({ el, display: el.style.display });
      el.style.display = 'none';
    }
  });

  // ─── Hide elements marked with data-pdf-hide (e.g., year-by-year table) ───
  const pdfHiddenElements: { el: HTMLElement; display: string }[] = [];
  element.querySelectorAll('[data-pdf-hide]').forEach((child) => {
    const el = child as HTMLElement;
    pdfHiddenElements.push({ el, display: el.style.display });
    el.style.display = 'none';
  });

  // Force overflow visible on all descendants
  const constrainedElements: { el: HTMLElement; overflow: string; overflowX: string; overflowY: string; maxHeight: string }[] = [];
  element.querySelectorAll('*').forEach((child) => {
    const el = child as HTMLElement;
    const style = window.getComputedStyle(el);
    const needsOverride = style.overflow !== 'visible'
      || style.overflowX !== 'visible'
      || style.overflowY !== 'visible'
      || (style.maxHeight !== 'none' && style.maxHeight !== '');
    if (needsOverride) {
      constrainedElements.push({
        el,
        overflow: el.style.overflow,
        overflowX: el.style.overflowX,
        overflowY: el.style.overflowY,
        maxHeight: el.style.maxHeight,
      });
      el.style.overflow = 'visible';
      el.style.overflowX = 'visible';
      el.style.overflowY = 'visible';
      el.style.maxHeight = 'none';
    }
  });

  // Allow layout to reflow before capture
  await new Promise(resolve => setTimeout(resolve, 250));

  // ─── Detect "keep-together" zones BEFORE capture ───
  const keepTogetherRects: { topOffset: number; bottomOffset: number }[] = [];
  {
    const containerRect = element.getBoundingClientRect();
    element.querySelectorAll('[data-pdf-keep-together]').forEach((child) => {
      const childRect = child.getBoundingClientRect();
      keepTogetherRects.push({
        topOffset: childRect.top - containerRect.top,
        bottomOffset: childRect.bottom - containerRect.top,
      });
    });
  }

  const [canvas, logoBase64] = await Promise.all([
    html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    }),
    loadLogoBase64(),
  ]);

  // ─── Restore ALL original styles ───
  element.style.width = originalWidth;
  element.style.minWidth = originalMinWidth;
  element.style.gridTemplateColumns = originalGridCols;
  element.style.display = originalDisplay;
  element.style.gap = originalGap;
  if (inputPanel) {
    inputPanel.style.display = originalInputDisplay;
  }
  constrainedElements.forEach(({ el, overflow, overflowX, overflowY, maxHeight }) => {
    el.style.overflow = overflow;
    el.style.overflowX = overflowX;
    el.style.overflowY = overflowY;
    el.style.maxHeight = maxHeight;
  });
  inputSwaps.forEach(({ input, placeholder }) => {
    input.style.display = '';
    placeholder.parentNode?.removeChild(placeholder);
  });
  hiddenButtons.forEach(({ el, display }) => { el.style.display = display; });
  hiddenHints.forEach(({ el, display }) => { el.style.display = display; });
  pdfHiddenElements.forEach(({ el, display }) => { el.style.display = display; });
  spacingOverrides.forEach(({ el, prop, original }) => {
    el.style.setProperty(prop, original);
  });
  spaceContainers.forEach(({ el, origDisplay, origFlexDir, origGap }) => {
    el.style.display = origDisplay;
    el.style.flexDirection = origFlexDir;
    el.style.gap = origGap;
  });

  // ─── Trim trailing blank space from canvas ───
  const actualContentBottom = findContentBottom(canvas);
  const imgWidth = canvas.width;
  const imgHeight = Math.min(actualContentBottom, canvas.height);

  // A4 dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const headerHeight = 18;
  const footerHeight = 14;
  const contentWidth = pageWidth - margin * 2;
  const contentStartY = margin + headerHeight + 2;
  const maxContentHeight = pageHeight - contentStartY - footerHeight - 3;

  // Scale factor
  const pxPerMm = imgWidth / contentWidth;
  const maxSlicePx = Math.floor(maxContentHeight * pxPerMm);

  // Convert keep-together rects to canvas pixel zones
  const htmlScale = 1.5;
  const keepTogetherZones: { startPx: number; endPx: number }[] = [];
  for (const rect of keepTogetherRects) {
    const startPx = Math.floor(rect.topOffset * htmlScale);
    const endPx = Math.ceil(rect.bottomOffset * htmlScale);
    if (endPx - startPx <= maxSlicePx) {
      keepTogetherZones.push({ startPx, endPx });
    }
  }

  // ─── Smart page-break detection ───
  function findSmartBreakPoints(): number[] {
    const breakPoints: number[] = [];
    let currentY = 0;

    while (currentY < imgHeight) {
      const idealBreak = currentY + maxSlicePx;

      if (idealBreak >= imgHeight) {
        breakPoints.push(imgHeight);
        break;
      }

      const searchRadius = Math.floor(maxSlicePx * 0.15);
      const searchStart = Math.max(currentY + 1, idealBreak - searchRadius);
      const searchEnd = Math.min(imgHeight - 1, idealBreak + Math.floor(searchRadius * 0.3));

      const tmpCanvas = document.createElement('canvas');
      const sampleWidth = Math.min(imgWidth, 200);
      const sampleStartX = Math.floor((imgWidth - sampleWidth) / 2);
      tmpCanvas.width = sampleWidth;
      tmpCanvas.height = searchEnd - searchStart;
      const tmpCtx = tmpCanvas.getContext('2d');

      let bestBreak = idealBreak;

      if (tmpCtx) {
        tmpCtx.drawImage(
          canvas,
          sampleStartX, searchStart, sampleWidth, searchEnd - searchStart,
          0, 0, sampleWidth, searchEnd - searchStart
        );
        const imgData = tmpCtx.getImageData(0, 0, sampleWidth, searchEnd - searchStart);
        const pixels = imgData.data;

        let bestScore = -1;
        for (let row = 0; row < searchEnd - searchStart; row++) {
          let whitePixels = 0;
          for (let col = 0; col < sampleWidth; col++) {
            const idx = (row * sampleWidth + col) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            if (r > 230 && g > 230 && b > 230) whitePixels++;
          }
          const score = whitePixels / sampleWidth;
          if (score > 0.85 && score > bestScore) {
            bestScore = score;
            bestBreak = searchStart + row;
          }
        }

        if (bestScore > 0.85) {
          let gapStart = bestBreak;
          let gapEnd = bestBreak;
          for (let r = bestBreak - searchStart - 1; r >= 0; r--) {
            let wc = 0;
            for (let c = 0; c < sampleWidth; c++) {
              const idx = (r * sampleWidth + c) * 4;
              if (pixels[idx] > 230 && pixels[idx+1] > 230 && pixels[idx+2] > 230) wc++;
            }
            if (wc / sampleWidth > 0.85) gapStart = searchStart + r;
            else break;
          }
          for (let r = bestBreak - searchStart + 1; r < searchEnd - searchStart; r++) {
            let wc = 0;
            for (let c = 0; c < sampleWidth; c++) {
              const idx = (r * sampleWidth + c) * 4;
              if (pixels[idx] > 230 && pixels[idx+1] > 230 && pixels[idx+2] > 230) wc++;
            }
            if (wc / sampleWidth > 0.85) gapEnd = searchStart + r;
            else break;
          }
          bestBreak = Math.floor((gapStart + gapEnd) / 2);
        }
      }

      // Keep-together protection
      for (const zone of keepTogetherZones) {
        if (bestBreak > zone.startPx && bestBreak < zone.endPx) {
          const adjustedBreak = Math.max(currentY + 1, zone.startPx - Math.floor(8 * pxPerMm));
          if (adjustedBreak - currentY > maxSlicePx * 0.2) {
            bestBreak = adjustedBreak;
          }
          break;
        }
      }

      const sliceH = bestBreak - currentY;
      if (sliceH > maxSlicePx) bestBreak = currentY + maxSlicePx;

      breakPoints.push(bestBreak);
      currentY = bestBreak;
    }

    return breakPoints;
  }

  const breakPoints = findSmartBreakPoints();

  // Total pages = 1 (summary page) + content pages + 1 (disclaimer page)
  const contentPages = breakPoints.length;
  const totalPages = 1 + contentPages + 1; // summary + content + disclaimer

  const pdf = new jsPDF('p', 'mm', 'a4');
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ─── Prepare logo data (once) ───
  let whiteLogoBase64: string | null = null;
  let logoNaturalWidth = 0;
  let logoNaturalHeight = 0;
  if (logoBase64) {
    whiteLogoBase64 = await createWhiteLogo(logoBase64);
    const tempImg = new Image();
    await new Promise<void>((resolve) => {
      tempImg.onload = () => resolve();
      tempImg.onerror = () => resolve();
      tempImg.src = logoBase64;
    });
    logoNaturalWidth = tempImg.width;
    logoNaturalHeight = tempImg.height;
  }

  const jpegQuality = 0.72;

  // ─── Helper: Draw header on any page ───
  function drawHeader(pageNum: number) {
    // Header bar
    pdf.setFillColor(15, 118, 110); // teal-700
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    // Accent stripe
    pdf.setFillColor(232, 85, 58);
    pdf.rect(0, headerHeight - 0.8, pageWidth, 0.8, 'F');

    // Logo
    let textStartX = margin;
    if (whiteLogoBase64 && logoNaturalWidth > 0) {
      try {
        const logoMaxH = headerHeight - 4;
        const logoAspect = logoNaturalWidth / logoNaturalHeight;
        const logoH = logoMaxH;
        const logoW = logoH * logoAspect;
        pdf.addImage(whiteLogoBase64, 'PNG', margin, 2, logoW, logoH);
        textStartX = margin + logoW + 3;
      } catch {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Trustner Asset Services', margin, 7);
      }
    } else {
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trustner Asset Services', margin, 7);
    }

    // Title text
    pdf.setTextColor(255, 255, 255);
    if (whiteLogoBase64) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, textStartX, 7);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(204, 251, 241);
      pdf.text('Trustner Asset Services Pvt. Ltd. | merasip.com', textStartX, 11);
    } else {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(204, 251, 241);
      pdf.text(title, margin, 12);
    }

    // Right side — page info
    pdf.setTextColor(204, 251, 241);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 7, { align: 'right' });
    pdf.setFontSize(5.5);
    pdf.text(`Generated: ${generatedDate}`, pageWidth - margin, 10.5, { align: 'right' });
  }

  // ─── Helper: Draw watermark on any page ───
  function drawWatermark() {
    if (!logoBase64) return;
    pdf.saveGraphicsState();
    const pdfObj = pdf as unknown as { GState: new (opts: { opacity: number }) => unknown };
    pdf.setGState(new pdfObj.GState({ opacity: 0.04 }));

    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    const wmH = 55;
    const wmAspect = logoNaturalWidth / (logoNaturalHeight || 1);
    const wmW = wmH * wmAspect;
    try {
      pdf.addImage(logoBase64, 'PNG', centerX - wmW / 2, centerY - wmH / 2, wmW, wmH);
    } catch {
      pdf.setTextColor(15, 118, 110);
      pdf.setFontSize(48);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TRUSTNER', centerX, centerY, { align: 'center', angle: 45 });
    }
    pdf.restoreGraphicsState();
  }

  // ─── Helper: Draw footer on any page ───
  function drawFooter() {
    const footerY = pageHeight - footerHeight;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, footerY - 1, pageWidth, footerHeight + 2, 'F');
    pdf.setDrawColor(15, 118, 110);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      'Trustner Asset Services Pvt. Ltd. | AMFI Registered MFD | ARN-286886 | CIN: U66301AS2023PTC025505',
      margin, footerY + 3
    );
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(4.5);
    pdf.text(
      'Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.',
      margin, footerY + 5.5
    );
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(5);
    pdf.text('www.merasip.com', pageWidth - margin, footerY + 3, { align: 'right' });
  }

  // ═══════════════════════════════════════════════════
  // PAGE 1: COMPACT PLAN SUMMARY (drawn entirely with jsPDF)
  // ═══════════════════════════════════════════════════
  drawHeader(1);
  drawWatermark();

  let y = contentStartY + 2;

  // ── Title banner ──
  pdf.setFillColor(240, 253, 244); // emerald-50
  pdf.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  pdf.setDrawColor(167, 243, 208); // emerald-300
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 16, 2, 2, 'S');

  pdf.setTextColor(15, 118, 110);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  const summaryTitle = planSummary.investorName
    ? `${planSummary.investorName}'s Financial Plan`
    : 'Financial Plan Summary';
  pdf.text(summaryTitle, margin + 5, y + 7);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  const subtitleParts: string[] = [];
  if (planSummary.investorAge) subtitleParts.push(`Age: ${planSummary.investorAge}`);
  subtitleParts.push(`Generated: ${generatedDate}`);
  pdf.text(subtitleParts.join(' | '), margin + 5, y + 12);

  y += 22;

  // ── Base Settings Grid (2-column boxes) ──
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BASE SETTINGS', margin, y);
  y += 5;

  const colWidth = (contentWidth - 4) / 2; // 2 columns with 4mm gap
  const boxH = 14;

  // Draw base settings as 2-column boxes
  for (let i = 0; i < planSummary.baseSettings.length; i++) {
    const setting = planSummary.baseSettings[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = margin + col * (colWidth + 4);
    const by = y + row * (boxH + 3);

    // Box background
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.roundedRect(bx, by, colWidth, boxH, 1.5, 1.5, 'F');
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.2);
    pdf.roundedRect(bx, by, colWidth, boxH, 1.5, 1.5, 'S');

    // Label
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(setting.label, bx + 3, by + 5);

    // Value
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sanitizePdfText(setting.value), bx + 3, by + 11);
  }

  const settingsRows = Math.ceil(planSummary.baseSettings.length / 2);
  y += settingsRows * (boxH + 3) + 5;

  // ── Life Events ──
  if (planSummary.events.length > 0) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`LIFE EVENTS (${planSummary.events.length})`, margin, y);
    y += 5;

    // Draw events in a compact 2-column grid
    const eventColWidth = (contentWidth - 4) / 2;

    for (let i = 0; i < planSummary.events.length; i++) {
      const ev = planSummary.events[i];
      const col = i % 2;
      const row = Math.floor(i / 2);

      // Calculate event box height based on details
      const detailLines = ev.details.length;
      const evBoxH = 10 + detailLines * 4;

      const ex = margin + col * (eventColWidth + 4);
      const ey = y + row * (evBoxH + 3);

      // Check if we need a new page
      if (ey + evBoxH > pageHeight - footerHeight - 5) break;

      // Box background — green for invest, amber for withdraw
      if (ev.color === 'green') {
        pdf.setFillColor(240, 253, 244); // emerald-50
        pdf.setDrawColor(167, 243, 208); // emerald-300
      } else {
        pdf.setFillColor(255, 251, 235); // amber-50
        pdf.setDrawColor(253, 230, 138); // amber-300
      }
      pdf.setLineWidth(0.3);
      pdf.roundedRect(ex, ey, eventColWidth, evBoxH, 1.5, 1.5, 'FD');

      // Event type badge
      if (ev.color === 'green') {
        pdf.setFillColor(6, 95, 70); // emerald-800
      } else {
        pdf.setFillColor(146, 64, 14); // amber-800
      }
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const badgeW = pdf.getTextWidth(ev.type) + 8;
      pdf.roundedRect(ex + 3, ey + 2, badgeW, 5, 1, 1, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(ev.type, ex + 3 + badgeW / 2, ey + 5.5, { align: 'center' });

      // Details
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      ev.details.forEach((detail, di) => {
        pdf.text(sanitizePdfText(detail), ex + 3, ey + 10 + di * 4);
      });
    }

    const eventRows = Math.ceil(planSummary.events.length / 2);
    const maxEvBoxH = planSummary.events.reduce((max, ev) => {
      return Math.max(max, 10 + ev.details.length * 4);
    }, 0);
    y += eventRows * (maxEvBoxH + 3) + 5;
  }

  // ── Result Summary (scraped from left panel results) ──
  if (planSummary.resultSummaries.length > 0) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESULTS SNAPSHOT', margin, y);
    y += 5;

    // Draw status card first (if any has status)
    const statusItems = planSummary.resultSummaries.filter(r => r.status);
    const regularItems = planSummary.resultSummaries.filter(r => !r.status);

    statusItems.forEach((item) => {
      const statusBoxH = 16;
      if (item.status === 'positive') {
        pdf.setFillColor(240, 253, 244); // emerald-50
        pdf.setDrawColor(167, 243, 208);
      } else {
        pdf.setFillColor(254, 242, 242); // red-50
        pdf.setDrawColor(252, 165, 165);
      }
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, contentWidth, statusBoxH, 2, 2, 'FD');

      // Status label
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label.toUpperCase(), margin + 5, y + 5);

      // Status value
      if (item.status === 'positive') {
        pdf.setTextColor(6, 95, 70);
      } else {
        pdf.setTextColor(153, 27, 27);
      }
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(sanitizePdfText(item.value), margin + 5, y + 12);

      y += statusBoxH + 4;
    });

    // Draw regular result items in 2-column grid
    const resColWidth = (contentWidth - 4) / 2;
    const resBoxH = 14;
    for (let i = 0; i < regularItems.length; i++) {
      const item = regularItems[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rx = margin + col * (resColWidth + 4);
      const ry = y + row * (resBoxH + 3);

      pdf.setFillColor(239, 246, 255); // blue-50
      pdf.roundedRect(rx, ry, resColWidth, resBoxH, 1.5, 1.5, 'F');
      pdf.setDrawColor(191, 219, 254);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(rx, ry, resColWidth, resBoxH, 1.5, 1.5, 'S');

      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label.toUpperCase(), rx + 3, ry + 5);

      pdf.setTextColor(30, 64, 175);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(sanitizePdfText(item.value), rx + 3, ry + 11);
    }

    const resRows = Math.ceil(regularItems.length / 2);
    y += resRows * (resBoxH + 3) + 5;
  }

  // ── Journey Summary text (if present from personalized banner) ──
  if (planSummary.journeySummary) {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'S');

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const journeyLines = pdf.splitTextToSize(sanitizePdfText(planSummary.journeySummary), contentWidth - 8);
    pdf.text(journeyLines.slice(0, 2), margin + 4, y + 5);
    y += 16;
  }

  drawFooter();

  // ═══════════════════════════════════════════════════
  // PAGES 2..N: RESULTS (charts, table, etc.) from canvas
  // ═══════════════════════════════════════════════════
  let sliceStart = 0;
  for (let page = 0; page < contentPages; page++) {
    pdf.addPage();
    const pageNum = page + 2; // Page 2 onwards

    drawHeader(pageNum);
    drawWatermark();

    const sliceEnd = breakPoints[page];
    const sourceY = sliceStart;
    const sourceH = sliceEnd - sliceStart;
    let destH = sourceH / pxPerMm;
    if (destH > maxContentHeight) destH = maxContentHeight;

    // Content slice
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidth;
    sliceCanvas.height = Math.ceil(sourceH);
    const ctx = sliceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceH, 0, 0, imgWidth, sourceH);
    }

    const sliceData = sliceCanvas.toDataURL('image/jpeg', jpegQuality);
    pdf.addImage(sliceData, 'JPEG', margin, contentStartY, contentWidth, destH);

    drawFooter();

    sliceStart = sliceEnd;
  }

  // ═══════════════════════════════════════════════════
  // LAST PAGE: REGULATORY DISCLAIMERS
  // ═══════════════════════════════════════════════════
  pdf.addPage();
  drawHeader(totalPages);
  drawWatermark();

  let dy = contentStartY + 2;

  // Disclaimer title
  pdf.setFillColor(254, 242, 242); // red-50
  pdf.roundedRect(margin, dy, contentWidth, 12, 2, 2, 'F');
  pdf.setDrawColor(252, 165, 165); // red-300
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, dy, contentWidth, 12, 2, 2, 'S');

  pdf.setTextColor(153, 27, 27); // red-800
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Important Disclaimers & Regulatory Information', margin + 5, dy + 7.5);
  dy += 18;

  // Helper to draw disclaimer sections
  function drawDisclaimerSection(heading: string, text: string, color: [number, number, number] = [71, 85, 105]) {
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(heading, margin, dy);
    dy += 4;

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth - 4);
    pdf.text(lines, margin + 2, dy);
    dy += lines.length * 3 + 3;
  }

  drawDisclaimerSection(
    'CALCULATOR DISCLAIMER',
    'Calculator results are for illustration purposes only. Actual returns may vary based on market conditions, fund performance, and other factors. The projections shown assume constant rates of return, which do not reflect actual market volatility. This tool is designed for educational and planning purposes only and should not be construed as financial advice.'
  );

  drawDisclaimerSection(
    'MUTUAL FUND RISK DISCLAIMER',
    'Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance does not guarantee future returns. The NAV of the schemes may go up or down depending upon the factors and forces affecting the securities market including the fluctuations in the interest rates. The past performance of the mutual funds is not necessarily indicative of future performance of the schemes.'
  );

  drawDisclaimerSection(
    'NO GUARANTEE',
    'There is no assurance or guarantee that the objectives of the scheme will be achieved. The portfolio of the schemes is subject to changes within the provisions of the Offer Document of the respective schemes. Investors are requested to review the prospectus carefully and obtain expert professional advice with regard to specific legal, tax and financial implications of the investment/participation in the scheme.'
  );

  drawDisclaimerSection(
    'KYC COMPLIANCE',
    'KYC is one-time exercise while dealing in securities markets — once KYC is done through a SEBI registered intermediary (broker, DP, mutual fund), you need not undergo the same process again when you approach another intermediary.'
  );

  drawDisclaimerSection(
    'INVESTOR AWARENESS',
    'Investors are advised to deal only with SEBI Registered Mutual Fund Distributors. Please verify the registration status at www.amfiindia.com. For investor grievances, please contact SEBI at https://scores.gov.in or toll-free number 1800-22-7575.'
  );

  // Separator
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, dy, pageWidth - margin, dy);
  dy += 5;

  // Company details
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ABOUT THE DISTRIBUTOR', margin, dy);
  dy += 5;

  const companyDetails = [
    ['Firm Name', 'Trustner Asset Services Pvt. Ltd.'],
    ['Type', 'AMFI Registered Mutual Fund Distributor'],
    ['AMFI ARN', 'ARN-286886'],
    ['CIN', 'U66301AS2023PTC025505'],
    ['Offices', 'Guwahati (HQ) | Bangalore | Kolkata | Hyderabad | Tezpur'],
    ['Contact', '6003903737 | wecare@merasip.com'],
    ['Website', 'www.merasip.com | www.trustner.in'],
    ['Grievance', 'grievance@trustner.in'],
  ];

  companyDetails.forEach(([label, value]) => {
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${label}:`, margin + 2, dy);

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    const lines = pdf.splitTextToSize(value, contentWidth - 35);
    pdf.text(lines, margin + 32, dy);
    dy += Math.max(lines.length * 3, 3.5);
  });

  dy += 3;

  // SEBI Disclaimer banner at bottom
  if (dy < pageHeight - footerHeight - 20) {
    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.roundedRect(margin, dy, contentWidth, 14, 2, 2, 'F');
    pdf.setDrawColor(191, 219, 254); // blue-300
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin, dy, contentWidth, 14, 2, 2, 'S');

    pdf.setTextColor(30, 64, 175); // blue-800
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SEBI INVESTOR CHARTER', margin + 4, dy + 4.5);

    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    const sebiText = 'For more details, visit: https://www.sebi.gov.in | SCORES: https://scores.gov.in | Toll Free: 1800-22-7575 | Smart ODR: https://smartodr.in';
    const sebiLines = pdf.splitTextToSize(sebiText, contentWidth - 8);
    pdf.text(sebiLines, margin + 4, dy + 8);
  }

  drawFooter();

  pdf.save(`${fileName}.pdf`);
}
