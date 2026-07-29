import { NextResponse } from "next/server";
import { InsufficientTokensError, tipCreator } from "@/lib/queries/tokens";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const creatorId = Number(body?.creatorId);
  const amount = Number(body?.amount);
  const message = typeof body?.message === "string" ? body.message : "";

  if (
    !Number.isInteger(creatorId) ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return NextResponse.json({ error: "Invalid tip request" }, { status: 400 });
  }
  if (creatorId === session.id) {
    return NextResponse.json(
      { error: "You cannot tip yourself" },
      { status: 400 },
    );
  }

  try {
    const balance = await tipCreator(session.id, creatorId, amount, message);
    return NextResponse.json({ success: true, balance });
  } catch (error) {
    if (error instanceof InsufficientTokensError) {
      return NextResponse.json(
        { error: "Insufficient tokens" },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Tip failed" }, { status: 500 });
  }
}
