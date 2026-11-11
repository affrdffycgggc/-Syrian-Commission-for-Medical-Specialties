import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: List all activities (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const specialtyId = searchParams.get("specialtyId");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (specialtyId && specialtyId !== "all") {
      where.specialtyId = specialtyId;
    }

    const activities = await db.activity.findMany({
      where,
      include: {
        sessions: true,
        specialty: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ activities });
  } catch (e) {
    return NextResponse.json(
      { error: "فشل في جلب النشاطات" },
      { status: 500 }
    );
  }
}

// POST: Create new activity (admin only)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "غير مصرح. يجب تسجيل الدخول كمدير" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      type,
      typeName,
      location,
      governorate,
      latitude,
      longitude,
      radius,
      startDate,
      endDate,
      daysCount,
      sessionsCount,
      timePeriod,
      hoursCount,
      cpdPoints,
      cpdPointsParticipation,
      requiredCpdForCertificate,
      fee,
      capacity,
      imageColor,
      featured,
      organizerName,
      organizerLogo,
      specialtyId,
      supportingLogos,
    } = body;

    if (!title || !type || !location || !startDate || !endDate) {
      return NextResponse.json(
        { error: "يرجى تعبئة الحقول المطلوبة" },
        { status: 400 }
      );
    }

    // Auto-calculate daysCount from dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const autoDaysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const feeNum = parseFloat(fee) || 0;
    const cpdNum = parseFloat(cpdPoints) || 0;
    // Default participation CPD = 150% of attendance CPD (HIGHER)
    const cpdParticipationNum = cpdPointsParticipation !== undefined && cpdPointsParticipation !== ""
      ? parseFloat(cpdPointsParticipation)
      : Math.round(cpdNum * 1.5 * 10) / 10;
    // Required CPD for certificate (0 = require all sessions)
    const requiredCpdNum = requiredCpdForCertificate !== undefined && requiredCpdForCertificate !== ""
      ? parseFloat(requiredCpdForCertificate)
      : 0;
    // Resident fee = half of practitioner fee
    const residentFeeNum = Math.round(feeNum * 0.5);

    const activity = await db.activity.create({
      data: {
        title,
        description: description || "",
        type,
        typeName: typeName || "",
        location,
        governorate: governorate || null,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        radius: radius ? parseFloat(radius) : 100,
        startDate: start,
        endDate: end,
        daysCount: autoDaysCount,
        sessionsCount: parseInt(sessionsCount) || 1,
        timePeriod: timePeriod || "",
        hoursCount: parseFloat(hoursCount) || 0,
        cpdPoints: cpdNum,
        cpdPointsParticipation: cpdParticipationNum,
        requiredCpdForCertificate: requiredCpdNum,
        fee: feeNum,
        residentFee: residentFeeNum,
        capacity: parseInt(capacity) || 100,
        imageColor: imageColor || "emerald",
        featured: featured === true,
        organizerName: organizerName || null,
        organizerLogo: organizerLogo || null,
        specialtyId: specialtyId || null,
        supportingLogos: supportingLogos || null,
      },
    });

    return NextResponse.json({ ok: true, activity });
  } catch (e) {
    return NextResponse.json(
      { error: "فشل في إنشاء النشاط" },
      { status: 500 }
    );
  }
}
