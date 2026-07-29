import { NextResponse } from "next/server";
import { purchaseTokens } from "@/lib/queries/tokens";
import { getSession } from "@/lib/session";

// Demo-only: credits tokens immediately. Wire up a real payment provider
// (e.g. Stripe Checkout + webhook) before charging real users.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const amount = Number(body?.amount);
  const packageType =
    typeof body?.packageType === "string" ? body.packageType : "custom";

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const balance = await purchaseTokens(session.id, amount, packageType);
  return NextResponse.json({ balance, tokensAdded: amount });
}
