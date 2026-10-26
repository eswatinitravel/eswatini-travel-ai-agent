"use client";
import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function PayPalCheckout({ fare }) {
  const [msg, setMsg] = useState("");
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) return <p className="err">Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to .env.local</p>;

  return (
    <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture" }}>
      <PayPalButtons
        style={{ layout: "vertical", label: "pay" }}
        createOrder={async () => {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fareId: fare.id })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data.id;
        }}
        onApprove={async ({ orderID }) => {
          const res = await fetch(`/api/orders/${orderID}/capture`, { method: "POST" });
          const data = await res.json();
          if (!res.ok) return setMsg(`Payment failed: ${data.error}`);
          setMsg(`Paid ${data.amount?.value} ${data.amount?.currency_code}. Capture ID: ${data.captureId}`);
        }}
        onError={(err) => setMsg(`Error: ${err.message}`)}
      />
      {msg && <p className="msg">{msg}</p>}
    </PayPalScriptProvider>
  );
}
