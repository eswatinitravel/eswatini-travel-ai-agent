import { NextResponse } from "next/server";
import { createOrder } from "@/lib/paypal";
import { findFare } from "@/lib/fares";

// The client sends only the fare id; the price is looked up on the server
// so nobody can change the amount in the browser.
export async function POST(req) {
  try {
    const { fareId } = await req.json();
    const fare = findFare(fareId);
    if (!fare) return NextResponse.json({ error: "Unknown fare" }, { status: 400 });
    const order = await createOrder(fare);
    return NextResponse.json({ id: order.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
