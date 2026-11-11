import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET sessions of an activity
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessions = await db.session.findMany({
      where: { activityId: id },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json({ sessions });
  } catch (e) {
    return NextResponse.json({ error: "فشل في جلب الجلسات" }, { status: 500 });
  }
}

// POST: Add session to activity (admin only) — supports per-session settings
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();

    // Use startTime/endTime for both startDate/endDate (legacy compatibility)
    const start = new Date(body.startTime || body.startDate);
    const end = new Date(body.endTime || body.endDate);

    const session = await db.session.create({
      data: {
        activityId: id,
        title: body.title,
        description: body.description || "",
        day: parseInt(body.day) || 1,
        startDate: start,
        endDate: end,
        startTime: start,
        endTime: end,
        speaker: body.speaker || null,
        // Per-session location
        hasCustomLocation: body.hasCustomLocation === true,
        location: body.location || null,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        radius: body.radius ? parseFloat(body.radius) : null,
        // Per-session CPD
        hasCustomCpd: body.hasCustomCpd === true,
        cpdPoints: body.cpdPoints ? parseFloat(body.cpdPoints) : 0,
      },
    });
    return NextResponse.json({ ok: true, session });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في إنشاء الجلسة" }, { status: 500 });
  }
}
