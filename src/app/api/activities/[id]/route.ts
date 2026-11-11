import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: Get activity by id (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await db.activity.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { startTime: "asc" } },
        specialty: true,
        _count: { select: { participants: true } },
      },
    });
    if (!activity) {
      return NextResponse.json({ error: "النشاط غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ activity });
  } catch (e) {
    return NextResponse.json({ error: "فشل في جلب النشاط" }, { status: 500 });
  }
}

// PUT: Update activity (admin only)
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

    // Compute resident fee = half of practitioner fee
    let residentFeeUpdate: number | undefined;
    if (body.fee !== undefined) {
      const feeNum = parseFloat(body.fee) || 0;
      residentFeeUpdate = Math.round(feeNum * 0.5);
    }

    // Default participation CPD = 150% of attendance CPD (HIGHER)
    let cpdParticipationUpdate: number | undefined;
    if (body.cpdPointsParticipation !== undefined && body.cpdPointsParticipation !== "") {
      cpdParticipationUpdate = parseFloat(body.cpdPointsParticipation);
    } else if (body.cpdPoints !== undefined) {
      const cpdNum = parseFloat(body.cpdPoints);
      cpdParticipationUpdate = Math.round(cpdNum * 1.5 * 10) / 10;
    }

    // Required CPD for certificate
    let requiredCpdUpdate: number | undefined;
    if (body.requiredCpdForCertificate !== undefined && body.requiredCpdForCertificate !== "") {
      requiredCpdUpdate = parseFloat(body.requiredCpdForCertificate);
    }

    const updated = await db.activity.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        typeName: body.typeName,
        location: body.location,
        governorate: body.governorate !== undefined ? (body.governorate || null) : undefined,
        latitude: body.latitude ? parseFloat(body.latitude) : undefined,
        longitude: body.longitude ? parseFloat(body.longitude) : undefined,
        radius: body.radius ? parseFloat(body.radius) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        daysCount: body.startDate && body.endDate
          ? Math.max(1, Math.ceil((new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) / (1000 * 60 * 60 * 24)))
          : body.daysCount ? parseInt(body.daysCount) : undefined,
        sessionsCount: body.sessionsCount ? parseInt(body.sessionsCount) : undefined,
        timePeriod: body.timePeriod,
        hoursCount: body.hoursCount ? parseFloat(body.hoursCount) : undefined,
        cpdPoints: body.cpdPoints !== undefined && body.cpdPoints !== "" ? parseFloat(body.cpdPoints) : undefined,
        cpdPointsParticipation: cpdParticipationUpdate,
        requiredCpdForCertificate: requiredCpdUpdate,
        fee: body.fee !== undefined ? parseFloat(body.fee) : undefined,
        residentFee: residentFeeUpdate,
        capacity: body.capacity ? parseInt(body.capacity) : undefined,
        status: body.status,
        imageColor: body.imageColor,
        featured: body.featured === true,
        organizerName: body.organizerName,
        organizerLogo: body.organizerLogo,
        specialtyId: body.specialtyId !== undefined ? (body.specialtyId || null) : undefined,
        supportingLogos: body.supportingLogos !== undefined ? (body.supportingLogos || null) : undefined,
      },
    });
    return NextResponse.json({ ok: true, activity: updated });
  } catch (e) {
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}

// DELETE: Delete activity (admin only)
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
    await db.activity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "فشل في الحذف" }, { status: 500 });
  }
}
