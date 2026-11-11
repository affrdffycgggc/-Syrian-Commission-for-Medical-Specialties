import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Register for an activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activityId, nationalId, fullName, role, participationType } = body;

    if (!activityId || !nationalId || !fullName || !role) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    if (role !== "practitioner" && role !== "resident") {
      return NextResponse.json(
        { error: "الصفة غير صحيحة" },
        { status: 400 }
      );
    }

    // Validate participation type for practitioners
    let validatedParticipationType: string | null = null;
    if (role === "practitioner") {
      if (!participationType || !["participation", "attendance"].includes(participationType)) {
        return NextResponse.json(
          { error: "يرجى تحديد نوع المشاركة (مشاركة أو حضور)" },
          { status: 400 }
        );
      }
      validatedParticipationType = participationType;
    }
    // Resident does not have participationType

    // Check activity exists and is active
    const activity = await db.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) {
      return NextResponse.json({ error: "النشاط غير موجود" }, { status: 404 });
    }
    if (activity.status !== "active") {
      return NextResponse.json(
        { error: "النشاط غير متاح للتسجيل" },
        { status: 400 }
      );
    }

    // Check capacity
    const participantCount = await db.participant.count({
      where: { activityId, paymentStatus: { in: ["approved", "awaiting_approval", "pending", "skipped"] } },
    });
    if (participantCount >= activity.capacity) {
      return NextResponse.json(
        { error: "اكتمل العدد. لا يمكن التسجيل" },
        { status: 400 }
      );
    }

    // Determine applicable fee based on role
    const applicableFee = role === "resident" ? activity.residentFee : activity.fee;

    // Check if already registered
    const existing = await db.participant.findUnique({
      where: {
        nationalId_activityId: { nationalId, activityId },
      },
    });

    if (existing) {
      // Update fullName/role/participationType if user is re-registering
      const updatedParticipant = await db.participant.update({
        where: { id: existing.id },
        data: {
          fullName,
          role,
          participationType: validatedParticipationType,
        },
      });
      return NextResponse.json({
        ok: true,
        participant: updatedParticipant,
        message: "مسجل مسبقاً",
        applicableFee,
      });
    }

    // Create participant
    const participant = await db.participant.create({
      data: {
        nationalId,
        fullName,
        role,
        participationType: validatedParticipationType,
        activityId,
        paymentStatus: "pending",
      },
    });

    return NextResponse.json({
      ok: true,
      participant,
      applicableFee,
      activity: {
        title: activity.title,
        fee: applicableFee,
        originalFee: activity.fee,
        residentFee: activity.residentFee,
        cpdPoints: activity.cpdPoints,
        cpdPointsParticipation: activity.cpdPointsParticipation,
      },
    });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في التسجيل" }, { status: 500 });
  }
}

// GET: Get participant by nationalId and activityId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nationalId = searchParams.get("nationalId");
    const activityId = searchParams.get("activityId");

    if (!nationalId || !activityId) {
      return NextResponse.json({ error: "نقص بيانات" }, { status: 400 });
    }

    const participant = await db.participant.findUnique({
      where: {
        nationalId_activityId: { nationalId, activityId },
      },
      include: {
        activity: { select: { id: true, title: true, fee: true, residentFee: true, cpdPoints: true, cpdPointsParticipation: true, location: true, latitude: true, longitude: true, radius: true, startDate: true, endDate: true } },
        attendances: { include: { session: true } },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "غير مسجل" }, { status: 404 });
    }

    return NextResponse.json({ participant });
  } catch (e) {
    return NextResponse.json({ error: "فشل في الجلب" }, { status: 500 });
  }
}
