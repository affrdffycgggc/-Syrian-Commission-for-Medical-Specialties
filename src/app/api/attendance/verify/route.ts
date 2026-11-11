import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateDistance } from "@/lib/helpers";

// Helper: Get effective CPD for a session based on role + participation type
// - Resident → 0 (no CPD)
// - Practitioner-Participation → uses cpdPointsParticipation (HIGHER, scaled from participation ratio)
// - Practitioner-Attendance → uses cpdPoints (LOWER, base)
function getEffectiveCpdForSession(
  activity: { cpdPoints: number; cpdPointsParticipation: number; cpdPointsResident: number },
  session: { hasCustomCpd: boolean; cpdPoints: number },
  participant: { role: string; participationType: string | null },
  sessionCount: number
): number {
  // Base session CPD (when hasCustomCpd): the session's cpdPoints
  // Otherwise: divide activity's base attendance CPD by session count
  const baseSessionCpd = session.hasCustomCpd && session.cpdPoints > 0
    ? session.cpdPoints
    : (sessionCount > 0 ? activity.cpdPoints / sessionCount : activity.cpdPoints);

  // Resident → 0 (no CPD)
  if (participant.role === "resident") {
    return 0;
  }

  // Practitioner-Participation → HIGHER CPD (use participation ratio)
  // Practitioner-Attendance → LOWER CPD (use base cpdPoints)
  if (participant.role === "practitioner") {
    if (participant.participationType === "participation") {
      // Participation CPD is higher - scale up by ratio
      if (activity.cpdPoints > 0) {
        const ratio = activity.cpdPointsParticipation / activity.cpdPoints;
        return Math.round(baseSessionCpd * ratio * 100) / 100;
      }
      return activity.cpdPointsParticipation / Math.max(1, sessionCount);
    } else {
      // attendance (default) - LOWER CPD
      return baseSessionCpd;
    }
  }

  return baseSessionCpd;
}

// POST: Verify attendance (geolocation + time) — respects per-session overrides + role + participation type
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participantId, sessionId, latitude, longitude } = body;

    if (!participantId || !sessionId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "بيانات ناقصة" },
        { status: 400 }
      );
    }

    const participant = await db.participant.findUnique({
      where: { id: participantId },
      include: { activity: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "المشارك غير موجود" },
        { status: 404 }
      );
    }

    if (participant.paymentStatus !== "approved" && participant.paymentStatus !== "skipped") {
      return NextResponse.json(
        { error: "يجب إتمام الدفع والحصول على موافقة الإدارة قبل تأكيد الحضور" },
        { status: 400 }
      );
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { activity: true },
    });

    if (!session) {
      return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    }

    if (session.activityId !== participant.activityId) {
      return NextResponse.json(
        { error: "الجلسة لا تنتمي للنشاط المسجل به" },
        { status: 400 }
      );
    }

    // Check if already verified
    const existing = await db.attendance.findUnique({
      where: {
        participantId_sessionId: { participantId, sessionId },
      },
    });
    if (existing && existing.verified) {
      return NextResponse.json({
        ok: true,
        alreadyVerified: true,
        attendance: existing,
        message: "تم تسجيل حضورك مسبقاً لهذه الجلسة",
      });
    }

    // Determine the target location: session override > activity default
    const targetLat = session.hasCustomLocation && session.latitude !== null
      ? session.latitude
      : participant.activity.latitude;
    const targetLon = session.hasCustomLocation && session.longitude !== null
      ? session.longitude
      : participant.activity.longitude;
    const targetRadius = session.hasCustomLocation && session.radius !== null
      ? session.radius
      : participant.activity.radius;
    const targetLocationName = session.hasCustomLocation && session.location
      ? session.location
      : participant.activity.location;

    // 1. Verify location (Haversine distance)
    const distance = calculateDistance(
      latitude,
      longitude,
      targetLat,
      targetLon
    );

    if (distance > targetRadius) {
      return NextResponse.json({
        ok: false,
        error: `أنت خارج نطاق الموقع المحدد (${targetLocationName}). المسافة الحالية: ${Math.round(distance)} متر. يجب أن تكون ضمن ${targetRadius} متر`,
        distance,
        requiredRadius: targetRadius,
        locationOk: false,
      }, { status: 403 });
    }

    // 2. Verify time window
    const bufferMinutes = 30;
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const buffer = bufferMinutes * 60 * 1000;

    if (now < new Date(start.getTime() - buffer)) {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      let msg = "الجلسة تبدأ خلال ";
      if (days > 0) msg += `${days} يوم و`;
      if (hours > 0) msg += `${hours} ساعة و`;
      msg += `${minutes} دقيقة`;
      return NextResponse.json({
        ok: false,
        error: msg,
        locationOk: true,
        timeOk: false,
        distance,
      }, { status: 403 });
    }
    if (now > new Date(end.getTime() + buffer)) {
      return NextResponse.json({
        ok: false,
        error: "انتهت الجلسة. لم يعد بإمكانك تأكيد الحضور",
        locationOk: true,
        timeOk: false,
        distance,
      }, { status: 403 });
    }

    // 3. Determine CPD points to award: based on role + participation type
    const sessionCount = await db.session.count({ where: { activityId: session.activityId } });
    const cpdToAward = getEffectiveCpdForSession(
      {
        cpdPoints: participant.activity.cpdPoints,
        cpdPointsParticipation: participant.activity.cpdPointsParticipation,
        cpdPointsResident: participant.activity.cpdPointsResident,
      },
      session,
      { role: participant.role, participationType: participant.participationType },
      sessionCount
    );

    // Create or update attendance record
    const attendance = await db.attendance.upsert({
      where: {
        participantId_sessionId: { participantId, sessionId },
      },
      update: {
        verified: true,
        verifiedAt: new Date(),
        latitude,
        longitude,
        distance,
        cpdAwarded: cpdToAward,
      },
      create: {
        participantId,
        sessionId,
        verified: true,
        verifiedAt: new Date(),
        latitude,
        longitude,
        distance,
        cpdAwarded: cpdToAward,
      },
    });

    // Calculate total CPD points earned by this participant
    const totalAttendances = await db.attendance.findMany({
      where: { participantId, verified: true },
      select: { cpdAwarded: true },
    });
    const totalCpd = totalAttendances.reduce((sum, a) => sum + a.cpdAwarded, 0);

    const isResident = participant.role === "resident";
    const message = isResident
      ? `تم تأكيد حضورك بنجاح! (المقيم لا يحصل على نقاط CPD)`
      : `تم تأكيد حضورك بنجاح! حصلت على ${cpdToAward.toFixed(1)} نقطة CPD`;

    return NextResponse.json({
      ok: true,
      attendance,
      distance,
      locationOk: true,
      timeOk: true,
      cpdAwarded: cpdToAward,
      totalCpd,
      usedSessionLocation: session.hasCustomLocation === true,
      sessionLocationName: targetLocationName,
      isResident,
      message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "فشل في تأكيد الحضور" },
      { status: 500 }
    );
  }
}

// GET: Get participant's attendance list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json({ error: "نقص بيانات" }, { status: 400 });
    }

    const participant = await db.participant.findUnique({
      where: { id: participantId },
      include: {
        activity: { include: { sessions: { orderBy: { startTime: "asc" } } } },
        attendances: { include: { session: true } },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    const totalCpd = participant.attendances
      .filter((a) => a.verified)
      .reduce((sum, a) => sum + a.cpdAwarded, 0);

    const verifiedCount = participant.attendances.filter((a) => a.verified).length;
    const totalSessions = participant.activity.sessions.length;

    // Check if user just completed all sessions (for auto-certificate trigger)
    const allSessionsVerified = totalSessions > 0 && verifiedCount === totalSessions;

    // Check certificate eligibility based on requiredCpdForCertificate
    const requiredCpd = (participant.activity as any).requiredCpdForCertificate || 0;
    let canGetCertificate = false;
    let certReason = "";
    if (participant.paymentStatus === "approved" || participant.paymentStatus === "skipped") {
      if (requiredCpd > 0) {
        canGetCertificate = totalCpd >= requiredCpd;
        certReason = canGetCertificate
          ? `اجتاز النقاط المطلوبة (${totalCpd.toFixed(1)} / ${requiredCpd})`
          : `يحتاج ${requiredCpd} نقطة، حصل على ${totalCpd.toFixed(1)}`;
      } else {
        canGetCertificate = allSessionsVerified;
        certReason = canGetCertificate
          ? `أكمل جميع الجلسات (${verifiedCount}/${totalSessions})`
          : `أكمل ${verifiedCount} من ${totalSessions} جلسة`;
      }
    } else {
      certReason = "يجب إكمال الدفع أولاً";
    }

    return NextResponse.json({
      participant,
      totalCpd,
      verifiedCount,
      totalSessions,
      allSessionsVerified,
      canGetCertificate,
      certReason,
      requiredCpdForCertificate: requiredCpd,
    });
  } catch (e) {
    return NextResponse.json({ error: "فشل في الجلب" }, { status: 500 });
  }
}
