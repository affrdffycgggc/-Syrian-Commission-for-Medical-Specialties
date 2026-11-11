import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin auth - participants list contains sensitive PII (national IDs)
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");

    const where: any = {};
    if (activityId) where.activityId = activityId;

    const participants = await db.participant.findMany({
      where,
      include: {
        activity: { select: { id: true, title: true, location: true } },
        attendances: {
          include: { session: { select: { id: true, title: true, startTime: true } } },
        },
        paymentRequests: {
          include: { paymentMethod: { select: { name: true } } },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    return NextResponse.json({ participants });
  } catch (e) {
    return NextResponse.json({ participants: [] });
  }
}
