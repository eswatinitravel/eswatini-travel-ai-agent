import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { findFare } from "@/lib/fares";

export const dynamic = "force-dynamic";

// POST { messages: [{ role: "user" | "assistant", content: string }] }
// -> { reply, recommendedFareId, fare, toolCalls, mode }
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const out = await runAgent(body.messages);
    const fare = out.recommendedFareId ? findFare(out.recommendedFareId) : null;
    return NextResponse.json({ ...out, recommendedFareId: fare ? fare.id : null, fare });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
