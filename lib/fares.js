// Sample fares for the demo. Phase 2 replaces these with live search results.
// Prices are in USD (PayPal sandbox currency). `stops` = number of connections.
export const FARES = [
  { id: "EK-JNB-LHE-1", airline: "Emirates", from: "JNB", to: "LHE", via: "DXB", stops: 1, depart: "2026-12-10", price: "612.00" },
  { id: "QR-JNB-LHE-1", airline: "Qatar Airways", from: "JNB", to: "LHE", via: "DOH", stops: 1, depart: "2026-12-10", price: "587.00" },
  { id: "EY-JNB-LHE-1", airline: "Etihad", from: "JNB", to: "LHE", via: "AUH", stops: 1, depart: "2026-12-11", price: "559.00" },
  { id: "ET-JNB-LHE-1", airline: "Ethiopian Airlines", from: "JNB", to: "LHE", via: "ADD + DXB", stops: 2, depart: "2026-12-12", price: "498.00" },
  { id: "QR-JNB-LHE-2", airline: "Qatar Airways", from: "JNB", to: "LHE", via: "DOH", stops: 1, depart: "2027-01-05", price: "541.00" },
  { id: "EK-LHE-JNB-1", airline: "Emirates", from: "LHE", to: "JNB", via: "DXB", stops: 1, depart: "2027-01-08", price: "598.00" },
  { id: "EY-LHE-JNB-1", airline: "Etihad", from: "LHE", to: "JNB", via: "AUH", stops: 1, depart: "2027-01-09", price: "571.00" },
  { id: "QR-LHE-JNB-1", airline: "Qatar Airways", from: "LHE", to: "JNB", via: "DOH", stops: 1, depart: "2026-12-20", price: "566.00" }
];

export function findFare(id) {
  return FARES.find((f) => f.id === id) || null;
}

export function cheapest(from, to) {
  return FARES.filter((f) => f.from === from && f.to === to)
    .sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
}

/**
 * Search fares. Dates may be a full day ("2026-12-10") or a month ("2026-12"),
 * matched as a prefix of the fare's departure date. Results are sorted by price.
 * `return_date` is accepted for the agent's tool schema; sample fares are one-way,
 * so it only adds a note.
 */
export function searchFares({ origin, destination, depart_date, return_date, max_stops } = {}) {
  const o = (origin || "").toUpperCase();
  const d = (destination || "").toUpperCase();
  const stopsCap = max_stops === undefined || max_stops === null || max_stops === "" ? null : Number(max_stops);
  const results = FARES.filter((f) =>
    (!o || f.from === o) &&
    (!d || f.to === d) &&
    (!depart_date || f.depart.startsWith(String(depart_date))) &&
    (stopsCap === null || Number.isNaN(stopsCap) || f.stops <= stopsCap)
  ).sort((a, b) => Number(a.price) - Number(b.price));
  return {
    query: { origin: o || null, destination: d || null, depart_date: depart_date || null, return_date: return_date || null, max_stops: stopsCap },
    count: results.length,
    results,
    note: return_date ? "Sample fares are one-way; book the return leg as a separate search." : undefined
  };
}
