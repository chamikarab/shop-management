import { SHOP_NAME } from "@/lib/exportReports";

export type ThermalReceiptItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  packaging?: string;
  discount?: number;
  discountType?: "flat" | "percentage";
  free?: boolean;
};

export type ThermalReceiptData = {
  cart: ThermalReceiptItem[];
  invoiceDate: string;
  invoiceId: string;
  grandTotal: number;
  cashGiven: number;
  discountValue: number;
  balance: number;
  paymentType: string;
  cashier?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseInvoiceDateTime(invoiceDate: string): { date: string; time: string } {
  const parsed = new Date(invoiceDate);
  if (Number.isNaN(parsed.getTime())) {
    return { date: invoiceDate, time: "" };
  }
  return {
    date: parsed.toLocaleDateString("en-LK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: parsed.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  };
}

export function calculateThermalItemTotal(item: ThermalReceiptItem): number {
  if (item.free) return 0;
  const baseTotal = item.price * item.quantity;
  if (item.discount) {
    if (item.discountType === "percentage") {
      return baseTotal - (baseTotal * item.discount) / 100;
    }
    return baseTotal - item.discount * item.quantity;
  }
  return baseTotal;
}

export function buildThermalReceiptHtml(data: ThermalReceiptData): string {
  const { date, time } = parseInvoiceDateTime(data.invoiceDate);
  const subtotal = data.grandTotal + data.discountValue;
  const totalQty = data.cart.reduce((sum, item) => sum + item.quantity, 0);
  const billNo = data.invoiceId.replace(/^INV/i, "").slice(-8).padStart(8, "0");
  const cashier = data.cashier || "Cashier";

  const itemsHtml = data.cart
    .map((item, index) => {
      const lineNo = String(index + 1).padStart(2, "0");
      const amount = calculateThermalItemTotal(item);
      const sizeLabel = [item.size, item.packaging].filter(Boolean).join(" / ");
      const title = `${lineNo} ${item.name}${sizeLabel ? ` - ${sizeLabel}` : ""}`;

      return `
        <div class="item-block">
          <p class="item-title">${escapeHtml(title)}</p>
          ${item.free ? '<p class="item-note">FREE</p>' : ""}
          ${
            item.discount && item.discount > 0 && !item.free
              ? `<p class="item-note">Item Discount: ${item.discount}${
                  item.discountType === "percentage" ? "%" : " Rs."
                }</p>`
              : ""
          }
          <div class="item-amount-row">
            <span class="col-price">${formatMoney(item.price)}</span>
            <span class="col-qty">X ${item.quantity}</span>
            <span class="col-amt">${formatMoney(amount)}</span>
          </div>
        </div>`;
    })
    .join("");

  return `<div id="print-invoice" class="thermal-receipt">
    <div class="center">
      <h1 class="shop-name">${escapeHtml(SHOP_NAME)}</h1>
      <div class="tagline center">Quality Beer &amp; Beverages</div>
      <p class="shop-line">Ankelipitiya, Thalathuoya Rd, Kandy</p>
      <p class="shop-line">Tel: 0779574545</p>
    </div>
    <div class="divider">------------------------------------------</div>
    <div class="meta">
      <div class="meta-col">
        <p class="meta-line">Date : ${escapeHtml(date)}</p>
        <p class="meta-line">Bill No : ${escapeHtml(billNo)}</p>
      </div>
      <div class="meta-col meta-right">
        <p class="meta-line">Operator: ${escapeHtml(cashier)}</p>
        <p class="meta-line">Pay : ${escapeHtml(data.paymentType)}</p>
      </div>
    </div>
    <div class="divider">------------------------------------------</div>
    <div class="table-head">
      <span>Ln</span>
      <span>Product</span>
      <span class="col-price">Price</span>
      <span class="col-qty">Qty</span>
      <span class="col-amt">Amount</span>
    </div>
    ${itemsHtml}
    <div class="divider">------------------------------------------</div>
    <div class="totals">
      <div class="total-row">
        <span>SUB TOTAL</span>
        <span>${formatMoney(subtotal)}</span>
      </div>
      ${
        data.discountValue > 0
          ? `<div class="total-row">
              <span>BILL DISCOUNT</span>
              <span>-${formatMoney(data.discountValue)}</span>
            </div>
            <div class="total-row">
              <span>SUB TOTAL</span>
              <span>${formatMoney(data.grandTotal)}</span>
            </div>`
          : ""
      }
      <div class="total-row bold">
        <span>${escapeHtml(data.paymentType.toUpperCase())}</span>
        <span>${formatMoney(data.paymentType === "Cash" ? data.cashGiven : data.grandTotal)}</span>
      </div>
      ${
        data.paymentType === "Cash"
          ? `<div class="total-row bold">
              <span>BALANCE</span>
              <span>${formatMoney(data.balance)}</span>
            </div>`
          : ""
      }
      ${
        data.discountValue > 0
          ? `<div class="total-row saved">
              <span>Saved Value :</span>
              <span>${formatMoney(data.discountValue)}</span>
            </div>`
          : ""
      }
    </div>
    <p class="footer-meta">NO OF QTY SOLD : ${totalQty}</p>
    ${time ? `<p class="footer-meta">TIME : ${escapeHtml(time)}</p>` : ""}
    <div class="divider">------------------------------------------</div>
    <p class="thanks">THANK YOU FOR SHOPPING</p>
    <div class="divider">------------------------------------------</div>
    <p class="policy">
      Please keep this bill for your records. Goods sold are not returnable once opened.
    </p>
    <div class="divider">******************************************</div>
    <p class="system-line">Powerd by www.chamikarabandara.com</p>
  </div>`;
}
