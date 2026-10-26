// Sample fares for the demo. Phase 2 replaces these with live search results
// found by the AI agent. Prices are in USD (PayPal sandbox currency).
export const FARES = [
  { id: "EK-JNB-LHE-1", airline: "Emirates", from: "JNB", to: "LHE", via: "DXB", depart: "2026-12-10", price: "612.00" },
  { id: "QR-JNB-LHE-1", airline: "Qatar Airways", from: "JNB", to: "LHE", via: "DOH", depart: "2026-12-10", price: "587.00" },
  { id: "EY-JNB-LHE-1", airline: "Etihad", from: "JNB", to: "LHE", via: "AUH", depart: "2026-12-11", price: "559.00" },
  { id: "EK-LHE-JNB-1", airline: "Emirates", from: "LHE", to: "JNB", via: "DXB", depart: "2027-01-08", price: "598.00" }
];

export function findFare(id) {
  return FARES.find((f) => f.id === id) || null;
}

export function cheapest(from, to) {
  return FARES.filter((f) => f.from === from && f.to === to)
    .sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
}
