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
  return (
    <div
      id="print-invoice"
      className="hidden print:block text-sm leading-5 p-4 max-w-md mx-auto text-black"
    >
      <div className="text-center mb-3">
        <p>************************</p>
        <p className="font-bold text-base">SISILA BEER SHOP</p>
        <p>Ankelipitiya, Thalathuoya Rd, Kandy</p>
        <p>📞 0779574545</p>
        <p>************************</p>
      </div>

      <p><strong>Date:</strong> {invoiceDate}</p>
      <p><strong>Invoice #:</strong> {invoiceId}</p>
      <p><strong>Cashier:</strong> Admin</p>

      <hr className="my-2 border-gray-400" />

      {cart.map((item) => (
        <div key={item.id} className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs">
              {item.size} / {item.packaging} × {item.quantity}
            </p>
            {item.free && (
              <p className="text-green-600 text-xs">Free Item</p>
            )}
            {item.discount ? (
              <p className="text-yellow-700 text-xs">
                Discount: {item.discount}
                {item.discountType === "percentage" ? "%" : " Rs."}
              </p>
            ) : null}
          </div>
          <div>
            <p>
              Rs.{" "}
              {item.free
                ? "0.00"
                : (
                    item.price * item.quantity -
                    (item.discountType === "percentage"
                      ? ((item.discount || 0) / 100) *
                        item.price *
                        item.quantity
                      : (item.discount || 0) * item.quantity)
                  ).toFixed(2)}
            </p>
          </div>
        </div>
      ))}

      <hr className="my-2 border-gray-400" />

      <p><strong>Total:</strong> Rs. {grandTotal.toFixed(2)}</p>
      <p><strong>Cash:</strong> Rs. {cashGiven.toFixed(2)}</p>
      <p><strong>Discount:</strong> Rs. {discountValue.toFixed(2)}</p>
      <p>
        <strong>Balance:</strong>{" "}
        <span className={balance < 0 ? "text-red-600 font-bold" : ""}>
          Rs. {balance.toFixed(2)}
        </span>
      </p>
      <p><strong>Payment:</strong> {paymentType}</p>

      <hr className="my-2 border-gray-400" />
      <div className="text-center">
        <p>**** THANK YOU ****</p>
      </div>
    </div>
  );
}