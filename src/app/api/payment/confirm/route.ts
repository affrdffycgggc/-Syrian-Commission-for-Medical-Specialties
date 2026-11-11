import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Create participant record (without payment - payment is via separate request)
// If payment is disabled, mark as "skipped" and allow direct access to attendance
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activityId, nationalId, fullName, role, participationType } = body;

    if (!activityId || !nationalId || !fullName || !role) {
      return NextResponse.json(
        { error: "بيانات ناقصة. يرجى إكمال جميع الحقول" },
        { status: 400 }
      );
    }

    if (role !== "practitioner" && role !== "resident") {
      return NextResponse.json({ error: "الصفة غير صحيحة" }, { status: 400 });
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

    const activity = await db.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return NextResponse.json({ error: "النشاط غير موجود" }, { status: 404 });
    }
    if (activity.status !== "active") {
      return NextResponse.json({ error: "النشاط غير متاح للتسجيل" }, { status: 400 });
    }

    const participantCount = await db.participant.count({
      where: { activityId, paymentStatus: { in: ["approved", "awaiting_approval", "pending", "skipped"] } },
    });
    if (participantCount >= activity.capacity) {
      return NextResponse.json({ error: "اكتمل العدد. لا يمكن التسجيل" }, { status: 400 });
    }

    // Determine applicable fee based on role
    const applicableFee = role === "resident" ? activity.residentFee : activity.fee;

    // Check if payment is enabled in system settings
    let settings = await db.systemSetting.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await db.systemSetting.create({
        data: { id: "singleton", paymentEnabled: true, manualPaymentInstructions: null },
      });
    }
    const paymentEnabled = settings.paymentEnabled && applicableFee > 0;

    const existing = await db.participant.findUnique({
      where: { nationalId_activityId: { nationalId, activityId } },
    });

    let participant;
    let paymentSkipped = false;

    if (existing) {
      // Always update fullName/role/participationType even if already approved
      // (user may be re-registering with a corrected name)
      participant = await db.participant.update({
        where: { id: existing.id },
        data: {
          fullName,
          role,
          participationType: validatedParticipationType,
        },
      });

      // If payment is already approved, return updated participant
      if (existing.paymentStatus === "approved" || existing.paymentStatus === "skipped") {
        return NextResponse.json({
          ok: true,
          participant,
          alreadyApproved: true,
          applicableFee,
          message: "تمت الموافقة على تسجيلك مسبقاً",
          activity: {
            title: activity.title,
            fee: applicableFee,
            location: activity.location,
            latitude: activity.latitude,
            longitude: activity.longitude,
            radius: activity.radius,
            startDate: activity.startDate,
            endDate: activity.endDate,
          },
        });
      }

      // If payment is disabled, mark as skipped (auto-approved)
      if (!paymentEnabled) {
        participant = await db.participant.update({
          where: { id: existing.id },
          data: {
            paymentStatus: "approved",
            paymentMethod: "skipped",
            paymentRef: `SKIP-${Date.now().toString(36).toUpperCase()}`,
            paidAt: new Date(),
          },
        });
        paymentSkipped = true;
      }
    } else {
      // Create new participant
      const initialStatus = paymentEnabled ? "pending" : "approved";

      participant = await db.participant.create({
        data: {
          nationalId,
          fullName,
          role,
          participationType: validatedParticipationType,
          activityId,
          paymentStatus: initialStatus,
          // If payment is disabled, set the skip info
          ...(paymentEnabled
            ? {}
            : {
                paymentMethod: "skipped",
                paymentRef: `SKIP-${Date.now().toString(36).toUpperCase()}`,
                paidAt: new Date(),
              }),
        },
      });

      if (!paymentEnabled) {
        paymentSkipped = true;
      }
    }

    return NextResponse.json({
      ok: true,
      participant,
      paymentSkipped,
      paymentEnabled,
      applicableFee,
      activity: {
        title: activity.title,
        fee: applicableFee,
        originalFee: activity.fee,
        residentFee: activity.residentFee,
        cpdPoints: activity.cpdPoints,
        cpdPointsParticipation: activity.cpdPointsParticipation,
        location: activity.location,
        latitude: activity.latitude,
        longitude: activity.longitude,
        radius: activity.radius,
        startDate: activity.startDate,
        endDate: activity.endDate,
      },
    });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في التسجيل" }, { status: 500 });
  }
}
