"use client";

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
}: InvoiceProps) {
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

  return (
    <div
      id="print-invoice"
      className="hidden print:block print:text-black print:bg-white"
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "80mm",
        margin: "0 auto",
        padding: "16px",
        color: "#000000",
      }}
    >
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Section */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black mb-2 tracking-tight" style={{ color: "#000000" }}>
          SISILA BEER SHOP
        </h1>
        <p className="text-sm font-semibold mb-1" style={{ color: "#000000" }}>
          Ankelipitiya, Thalathuoya Rd, Kandy
        </p>
        <p className="text-sm font-medium" style={{ color: "#000000" }}>
          Tel: 0779574545
        </p>
      </div>

      {/* Invoice Details */}
      <div className="mb-6 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ color: "#000000" }}>Date:</span>
          <span className="font-semibold" style={{ color: "#000000" }}>{invoiceDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ color: "#000000" }}>Invoice #:</span>
          <span className="font-semibold" style={{ color: "#000000" }}>{invoiceId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ color: "#000000" }}>Cashier:</span>
          <span className="font-semibold" style={{ color: "#000000" }}>Admin</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ color: "#000000" }}>Payment:</span>
          <span className="font-semibold" style={{ color: "#000000" }}>{paymentType}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-black my-4"></div>

      {/* Items Section */}
      <div className="mb-6 space-y-3">
        <div className="text-center mb-3">
          <h2 className="text-base font-black uppercase tracking-wide" style={{ color: "#000000" }}>
            Items
          </h2>
        </div>
        
        {cart.map((item) => (
          <div key={item.id} className="border-b border-gray-300 pb-3 last:border-b-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 pr-2">
                <p className="font-bold text-sm leading-tight mb-1" style={{ color: "#000000" }}>
                  {item.name}
                </p>
                <div className="text-xs space-y-0.5" style={{ color: "#000000" }}>
                  {item.size && item.packaging && (
                    <p className="font-medium">
                      {item.size} / {item.packaging}
                    </p>
                  )}
                  <p className="font-semibold">
                    Qty: {item.quantity} × Rs.{item.price.toFixed(2)}
                  </p>
                  {item.free && (
                    <p className="font-bold uppercase" style={{ color: "#000000" }}>
                      [FREE ITEM]
                    </p>
                  )}
                  {item.discount && item.discount > 0 && (
                    <p className="font-semibold" style={{ color: "#000000" }}>
                      Discount: {item.discount}
                      {item.discountType === "percentage" ? "%" : " Rs."}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-sm" style={{ color: "#000000" }}>
                  Rs.{calculateItemTotal(item).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t-2 border-black my-4"></div>

      {/* Totals Section */}
      <div className="mb-6 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ color: "#000000" }}>Subtotal:</span>
          <span className="font-semibold" style={{ color: "#000000" }}>
            Rs.{grandTotal.toFixed(2)}
          </span>
        </div>
        
        {discountValue > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-bold" style={{ color: "#000000" }}>Discount:</span>
            <span className="font-semibold" style={{ color: "#000000" }}>
              -Rs.{discountValue.toFixed(2)}
            </span>
          </div>
        )}

        {paymentType === "Cash" && (
          <>
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: "#000000" }}>Cash Received:</span>
              <span className="font-semibold" style={{ color: "#000000" }}>
                Rs.{cashGiven.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-black pt-2 mt-2">
              <span className="font-black text-base" style={{ color: "#000000" }}>Change:</span>
              <span className="font-black text-base" style={{ color: "#000000" }}>
                Rs.{balance.toFixed(2)}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center border-t-2 border-black pt-3 mt-3">
          <span className="font-black text-lg" style={{ color: "#000000" }}>TOTAL:</span>
          <span className="font-black text-lg" style={{ color: "#000000" }}>
            Rs.{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-black my-4"></div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-base font-black mb-2" style={{ color: "#000000" }}>
          THANK YOU FOR YOUR BUSINESS
        </p>
        <p className="text-xs font-semibold" style={{ color: "#000000" }}>
          Please visit us again!
        </p>
      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
}
