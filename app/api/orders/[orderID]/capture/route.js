import { NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal";

export async function POST(_req, { params }) {
  try {
    const { orderID } = await params;
    const data = await captureOrder(orderID);
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    return NextResponse.json({
      status: data.status,
      captureId: capture?.id,
      amount: capture?.amount,
      payer: data.payer?.name
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
