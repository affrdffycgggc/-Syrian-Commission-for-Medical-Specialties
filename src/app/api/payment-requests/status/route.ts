import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Get the latest payment request status for a participant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json({ error: "نقص بيانات" }, { status: 400 });
    }

    const request = await db.paymentRequest.findFirst({
      where: { participantId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        operationNumber: true,
        amount: true,
        adminNote: true,
        submittedAt: true,
        reviewedAt: true,
        paymentMethod: { select: { name: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ request: null });
    }

    return NextResponse.json({ request });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في جلب الحالة" }, { status: 500 });
  }
}
