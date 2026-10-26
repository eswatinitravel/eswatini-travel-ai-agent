// Server-only helpers for the PayPal Orders v2 REST API.
const BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env.local");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description || res.status}`);
  return data.access_token;
}

export async function createOrder(fare) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: fare.id,
        description: `${fare.airline} ${fare.from}-${fare.to} via ${fare.via} on ${fare.depart}`,
        amount: { currency_code: "USD", value: fare.price }
      }]
    }),
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Create order failed: ${data.message || res.status}`);
  return data;
}

export async function captureOrder(orderID) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Capture failed: ${data.message || res.status}`);
  return data;
}
