// Run with: npm test  (uses Node's built-in test runner, no extra deps)
import test from "node:test";
import assert from "node:assert/strict";
import { searchFares } from "../lib/fares.js";
import { parseRequest, runAgent } from "../lib/agent.js";

const NOW = new Date("2026-10-29T00:00:00Z");

test("searchFares sorts by price and respects max_stops", () => {
  const all = searchFares({ origin: "JNB", destination: "LHE" });
  const prices = all.results.map((f) => Number(f.price));
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  const oneStop = searchFares({ origin: "JNB", destination: "LHE", max_stops: 1 });
  assert.ok(oneStop.results.every((f) => f.stops <= 1));
});

test("parseRequest understands route, month and stops", () => {
  assert.deepEqual(parseRequest("cheapest Johannesburg to Lahore in December, 1 stop max", NOW),
    { origin: "JNB", destination: "LHE", depart_date: "2026-12", max_stops: 1 });
  assert.deepEqual(parseRequest("from Lahore to Joburg in January", NOW),
    { origin: "LHE", destination: "JNB", depart_date: "2027-01" });
});

test("rule-based agent (no key) recommends the cheapest matching fare", async () => {
  const out = await runAgent([{ role: "user", content: "cheapest Johannesburg to Lahore in December, 1 stop max" }], {});
  assert.equal(out.mode, "rules");
  assert.equal(out.recommendedFareId, "EY-JNB-LHE-1");
  const anyStops = await runAgent([{ role: "user", content: "Johannesburg to Lahore in December" }], {});
  assert.equal(anyStops.recommendedFareId, "ET-JNB-LHE-1");
});
