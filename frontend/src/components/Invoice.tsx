"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SHOP_NAME } from "@/lib/exportReports";
import { clearThermalPrintPageSize, prepareThermalPrint } from "@/lib/printThermalReceipt";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  size?: string;
  packaging?: string;
  discount?: number;
  discountType?: "flat" | "percentage";
  free?: boolean;
}

interface InvoiceProps {
  cart: Product[];
  invoiceDate: string;
  invoiceId: string;
  grandTotal: number;
  cashGiven: number;
  discountValue: number;
  balance: number;
  paymentType: string;
  cashier?: string;
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

export default function Invoice({
  cart,
  invoiceDate,
  invoiceId,
  grandTotal,
  cashGiven,
  discountValue,
  balance,
  paymentType,
  cashier = "Cashier",
}: InvoiceProps) {
  useEffect(() => {
    const syncPageSize = () => prepareThermalPrint();
    const clearPageSize = () => clearThermalPrintPageSize();

    window.addEventListener("beforeprint", syncPageSize);
    window.addEventListener("afterprint", clearPageSize);
    return () => {
      window.removeEventListener("beforeprint", syncPageSize);
      window.removeEventListener("afterprint", clearPageSize);
      clearPageSize();
    };
  }, [cart, invoiceDate, invoiceId, grandTotal, discountValue, paymentType]);

  const calculateItemTotal = (item: Product): number => {
    if (item.free) return 0;
    const baseTotal = item.price * item.quantity;
    if (item.discount) {
      if (item.discountType === "percentage") {
        return baseTotal - (baseTotal * item.discount) / 100;
      }
      return baseTotal - item.discount * item.quantity;
    }
    return baseTotal;
  };

  const { date, time } = parseInvoiceDateTime(invoiceDate);
  const subtotal = grandTotal + discountValue;
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const billNo = invoiceId.replace(/^INV/i, "").slice(-8).padStart(8, "0");

  if (typeof document === "undefined") return null;

  const receipt = (
    <div id="print-invoice" className="thermal-receipt">
      <style jsx global>{`
        @media print {
          html,
          body {
            width: 72mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }

          body > *:not(#print-invoice) {
            display: none !important;
          }

          #print-invoice {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 72mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 1mm 2mm 2mm !important;
            background: #fff !important;
            color: #000 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            break-after: avoid !important;
            break-before: avoid !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #print-invoice * {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <style jsx>{`
        .thermal-receipt {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 72mm;
          visibility: hidden;
          pointer-events: none;
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background: #fff;
        }

        .center {
          text-align: center;
        }

        .shop-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0 0 3px;
          text-transform: uppercase;
        }

        .tagline {
          background: #000;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          margin: 4px 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .shop-line {
          margin: 0;
          font-size: 10px;
        }

        .divider {
          margin: 4px 0;
          overflow: hidden;
          white-space: nowrap;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
        }

        .meta-col {
          flex: 1;
        }

        .meta-right {
          text-align: right;
        }

        .meta-line {
          margin: 1px 0;
        }

        .table-head {
          display: grid;
          grid-template-columns: 16px 1fr 44px 28px 52px;
          gap: 2px;
          align-items: baseline;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 3px;
        }

        .item-amount-row {
          display: grid;
          grid-template-columns: 44px 28px 1fr;
          gap: 2px;
          align-items: baseline;
          font-size: 10px;
          margin: 0 0 0 18px;
        }

        .col-price,
        .col-qty,
        .col-amt {
          text-align: right;
        }

        .item-block {
          margin-bottom: 3px;
        }

        .item-title {
          font-size: 10px;
          font-weight: 700;
          margin: 0 0 1px;
          word-break: break-word;
        }

        .item-note {
          font-size: 9px;
          margin: 0 0 1px 18px;
        }

        .item-amount-row {
          margin-bottom: 0;
        }

        .item-amount-row .col-amt {
          text-align: right;
        }

        .totals {
          margin-top: 2px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
          margin: 1px 0;
        }

        .total-row.bold {
          font-weight: 700;
          font-size: 12px;
          margin-top: 3px;
        }

        .total-row.saved {
          font-weight: 700;
          font-size: 13px;
          margin-top: 4px;
        }

        .footer-meta {
          font-size: 10px;
          margin: 1px 0;
        }

        .thanks {
          text-align: center;
          font-weight: 700;
          font-size: 11px;
          margin: 3px 0;
          letter-spacing: 0.5px;
        }

        .policy {
          text-align: center;
          font-size: 8px;
          line-height: 1.35;
          margin: 2px 0 0;
          text-transform: uppercase;
        }

        .system-line {
          text-align: center;
          font-size: 8px;
          margin: 3px 0 0;
          padding-bottom: 0;
        }
      `}</style>

      <div className="center">
        <h1 className="shop-name">{SHOP_NAME}</h1>
        <div className="tagline center">Quality Beer &amp; Beverages</div>
        <p className="shop-line">Ankelipitiya, Thalathuoya Rd, Kandy</p>
        <p className="shop-line">Tel: 0779574545</p>
      </div>

      <div className="divider">--------------------------------</div>

      <div className="meta">
        <div className="meta-col">
          <p className="meta-line">Date : {date}</p>
          <p className="meta-line">Bill No : {billNo}</p>
        </div>
        <div className="meta-col meta-right">
          <p className="meta-line">Operator: {cashier}</p>
          <p className="meta-line">Pay : {paymentType}</p>
        </div>
      </div>

      <div className="divider">--------------------------------</div>

      <div className="table-head">
        <span>Ln</span>
        <span>Product</span>
        <span className="col-price">Price</span>
        <span className="col-qty">Qty</span>
        <span className="col-amt">Amount</span>
      </div>

      {cart.map((item, index) => {
        const lineNo = String(index + 1).padStart(2, "0");
        const amount = calculateItemTotal(item);
        const sizeLabel = [item.size, item.packaging].filter(Boolean).join(" / ");

        return (
          <div key={`${item.id}-${index}`} className="item-block">
            <p className="item-title">
              {lineNo} {item.name}
              {sizeLabel ? ` - ${sizeLabel}` : ""}
            </p>
            {item.free && <p className="item-note">FREE</p>}
            {item.discount && item.discount > 0 && !item.free && (
              <p className="item-note">
                Item Discount: {item.discount}
                {item.discountType === "percentage" ? "%" : " Rs."}
              </p>
            )}
            <div className="item-amount-row">
              <span className="col-price">{formatMoney(item.price)}</span>
              <span className="col-qty">X {item.quantity}</span>
              <span className="col-amt">{formatMoney(amount)}</span>
            </div>
          </div>
        );
      })}

      <div className="divider">--------------------------------</div>

      <div className="totals">
        <div className="total-row">
          <span>SUB TOTAL</span>
          <span>{formatMoney(subtotal)}</span>
        </div>

        {discountValue > 0 && (
          <div className="total-row">
            <span>BILL DISCOUNT</span>
            <span>-{formatMoney(discountValue)}</span>
          </div>
        )}

        {discountValue > 0 && (
          <div className="total-row">
            <span>SUB TOTAL</span>
            <span>{formatMoney(grandTotal)}</span>
          </div>
        )}

        <div className="total-row bold">
          <span>{paymentType.toUpperCase()}</span>
          <span>{formatMoney(paymentType === "Cash" ? cashGiven : grandTotal)}</span>
        </div>

        {paymentType === "Cash" && (
          <div className="total-row bold">
            <span>BALANCE</span>
            <span>{formatMoney(balance)}</span>
          </div>
        )}

        {discountValue > 0 && (
          <div className="total-row saved">
            <span>Saved Value :</span>
            <span>{formatMoney(discountValue)}</span>
          </div>
        )}
      </div>

      <p className="footer-meta">NO OF QTY SOLD : {totalQty}</p>
      {time && <p className="footer-meta">TIME : {time}</p>}

      <div className="divider">--------------------------------</div>
      <p className="thanks">THANK YOU FOR SHOPPING</p>
      <div className="divider">--------------------------------</div>
      <p className="policy">
        Please keep this bill for your records. Goods sold are not returnable once
        opened.
      </p>
      <div className="divider">********************************</div>
      <p className="system-line">Sisila Beer Shop Management System</p>
    </div>
  );

  return createPortal(receipt, document.body);
}
