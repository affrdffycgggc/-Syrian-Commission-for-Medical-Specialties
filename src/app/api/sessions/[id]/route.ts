import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// PUT: Update a session (per-session settings)
export async function PUT(
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

    // Compute start/end dates from startTime/endTime if provided
    const startTime = body.startTime ? new Date(body.startTime) : undefined;
    const endTime = body.endTime ? new Date(body.endTime) : undefined;

    const updated = await db.session.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        day: body.day ? parseInt(body.day) : undefined,
        startDate: startTime,
        endDate: endTime,
        startTime: startTime,
        endTime: endTime,
        speaker: body.speaker || null,
        hasCustomLocation: body.hasCustomLocation === true,
        location: body.location || null,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        radius: body.radius ? parseFloat(body.radius) : null,
        hasCustomCpd: body.hasCustomCpd === true,
        cpdPoints: body.cpdPoints ? parseFloat(body.cpdPoints) : 0,
        status: body.status,
      },
    });
    return NextResponse.json({ ok: true, session: updated });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في تحديث الجلسة" }, { status: 500 });
  }
}

// DELETE session
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const { id } = await params;
    await db.session.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "فشل في حذف الجلسة" }, { status: 500 });
  }
}
