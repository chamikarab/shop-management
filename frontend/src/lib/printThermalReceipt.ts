import {
  buildThermalReceiptHtml,
  type ThermalReceiptData,
} from "@/lib/thermalReceiptHtml";

const THERMAL_PRINT_PAGE_STYLES = `
  @page { size: 72mm auto; margin: 0; }
  html, body {
    width: 72mm;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }
  body {
    font-family: "Courier New", Courier, monospace;
    color: #000;
  }
  #print-invoice,
  .thermal-receipt {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: 72mm;
    box-sizing: border-box;
    padding: 2mm 3mm 2mm;
    margin: 0;
    page-break-after: avoid;
    page-break-before: avoid;
    break-after: avoid;
    break-before: avoid;
  }
  .thermal-receipt .center { text-align: center; }
  .thermal-receipt .shop-name {
    font-size: 18px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase;
  }
  .thermal-receipt .tagline {
    background: #000; color: #fff; font-size: 9px; font-weight: 700;
    padding: 3px 6px; margin: 6px 0 8px; text-transform: uppercase;
  }
  .thermal-receipt .shop-line { margin: 0; font-size: 10px; }
  .thermal-receipt .divider {
    margin: 4px 0; overflow: hidden; white-space: nowrap; font-size: 10px;
  }
  .thermal-receipt .meta { display: flex; justify-content: space-between; gap: 8px; font-size: 10px; }
  .thermal-receipt .meta-col { flex: 1; }
  .thermal-receipt .meta-right { text-align: right; }
  .thermal-receipt .meta-line { margin: 1px 0; }
  .thermal-receipt .table-head {
    display: grid;
    grid-template-columns: 16px 1fr 44px 28px 52px;
    gap: 2px; align-items: baseline; font-size: 10px;
    font-weight: 700; margin-bottom: 3px;
  }
  .thermal-receipt .item-amount-row {
    display: grid;
    grid-template-columns: 44px 28px 1fr;
    gap: 2px; align-items: baseline; font-size: 10px;
    margin: 0 0 0 18px;
  }
  .thermal-receipt .col-price,
  .thermal-receipt .col-qty,
  .thermal-receipt .col-amt { text-align: right; }
  .thermal-receipt .item-block { margin-bottom: 3px; page-break-inside: avoid; break-inside: avoid; }
  .thermal-receipt .item-title {
    font-size: 10px; font-weight: 700; margin: 0 0 1px; word-break: break-word;
  }
  .thermal-receipt .item-note { font-size: 9px; margin: 0 0 1px 18px; }
  .thermal-receipt .total-row {
    display: flex; justify-content: space-between; gap: 8px; font-size: 10px; margin: 2px 0;
  }
  .thermal-receipt .total-row.bold { font-weight: 700; font-size: 12px; margin-top: 4px; }
  .thermal-receipt .total-row.saved { font-weight: 700; font-size: 13px; margin-top: 6px; }
  .thermal-receipt .footer-meta { font-size: 10px; margin: 2px 0; }
  .thermal-receipt .thanks {
    text-align: center; font-weight: 700; font-size: 11px; margin: 4px 0;
  }
  .thermal-receipt .policy {
    text-align: center; font-size: 8px; line-height: 1.35; margin: 2px 0 0; text-transform: uppercase;
  }
  .thermal-receipt .system-line { text-align: center; font-size: 8px; margin-top: 4px; }
`;

const THERMAL_PAGE_STYLE_ID = "thermal-page-size";
const THERMAL_PRINT_IFRAME_ID = "thermal-print-iframe";

function pxToMm(px: number): number {
  return Math.ceil(px * 0.264583 * 10) / 10;
}

function measureReceiptHeightMm(source: HTMLElement): number {
  const heightMm = pxToMm(source.scrollHeight) + 12;
  return Math.max(heightMm, 60);
}

function applyPageSizeToDocument(doc: Document, heightMm: number) {
  const existing = doc.getElementById(THERMAL_PAGE_STYLE_ID);
  existing?.remove();

  const styleEl = doc.createElement("style");
  styleEl.id = THERMAL_PAGE_STYLE_ID;
  styleEl.textContent = `@media print {
    @page { size: 72mm ${heightMm}mm; margin: 0; }
  }`;
  doc.head.appendChild(styleEl);
}

function buildReceiptDocument(receiptHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Receipt</title>
    <style>${THERMAL_PRINT_PAGE_STYLES}</style>
  </head>
  <body>
    ${receiptHtml}
  </body>
</html>`;
}

function getCleanReceiptMarkup(source: HTMLElement): string {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("style").forEach((el) => el.remove());
  clone.id = "print-invoice";
  clone.className = "thermal-receipt";
  clone.removeAttribute("style");
  return clone.outerHTML;
}

function waitForReceipt(sourceId: string, timeoutMs = 2000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const started = Date.now();

    const check = () => {
      const receipt = document.getElementById(sourceId);
      if (receipt && receipt.textContent?.trim()) {
        resolve(receipt);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(receipt);
        return;
      }
      window.setTimeout(check, 50);
    };

    check();
  });
}

function removePrintIframe() {
  document.getElementById(THERMAL_PRINT_IFRAME_ID)?.remove();
}

function printReceiptHtml(receiptHtml: string): boolean {
  if (!receiptHtml.trim()) return false;

  removePrintIframe();

  const iframe = document.createElement("iframe");
  iframe.id = THERMAL_PRINT_IFRAME_ID;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:72mm;min-height:1px;border:0;z-index:-1;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const doc = iframe.contentDocument || frameWindow?.document;
  if (!doc || !frameWindow) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(buildReceiptDocument(receiptHtml));
  doc.close();

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    const receipt = doc.getElementById("print-invoice");
    if (!receipt || !receipt.textContent?.trim()) {
      iframe.remove();
      return;
    }

    printed = true;
    applyPageSizeToDocument(doc, measureReceiptHeightMm(receipt));
    frameWindow.focus();
    frameWindow.print();
  };

  frameWindow.addEventListener("afterprint", () => {
    window.setTimeout(removePrintIframe, 300);
  });

  iframe.addEventListener("load", () => window.setTimeout(runPrint, 50), { once: true });
  window.setTimeout(runPrint, 150);

  return true;
}

function printInCurrentWindow(sourceId: string): boolean {
  const receipt = document.getElementById(sourceId);
  if (!receipt) return false;

  const forceStyleId = "thermal-print-force-visible";
  document.getElementById(forceStyleId)?.remove();

  const forceStyle = document.createElement("style");
  forceStyle.id = forceStyleId;
  forceStyle.textContent = `
    @media print {
      body > *:not(#${sourceId}) { display: none !important; }
      #${sourceId} {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        left: auto !important;
        top: auto !important;
        width: 72mm !important;
        margin: 0 auto !important;
        background: #fff !important;
        color: #000 !important;
      }
    }
  `;
  document.head.appendChild(forceStyle);

  prepareThermalPrint(sourceId);

  const cleanup = () => {
    document.getElementById(forceStyleId)?.remove();
    clearThermalPrintPageSize();
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  return true;
}

export function prepareThermalPrint(sourceId = "print-invoice") {
  const receipt = document.getElementById(sourceId);
  if (!receipt) return;
  applyPageSizeToDocument(document, measureReceiptHeightMm(receipt));
}

export function clearThermalPrintPageSize() {
  document.getElementById(THERMAL_PAGE_STYLE_ID)?.remove();
}

export async function printThermalReceipt(
  data?: ThermalReceiptData,
  sourceId = "print-invoice"
): Promise<boolean> {
  if (data && data.cart.length > 0) {
    return printReceiptHtml(buildThermalReceiptHtml(data));
  }

  const source = await waitForReceipt(sourceId);
  if (source && source.textContent?.trim()) {
    const printed = printReceiptHtml(getCleanReceiptMarkup(source));
    if (printed) return true;
    return printInCurrentWindow(sourceId);
  }

  console.error("Receipt data missing and #print-invoice not found");
  return false;
}

export type { ThermalReceiptData };
