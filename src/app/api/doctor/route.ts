import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Lookup doctor by national ID - returns all activities participated in with CPD totals
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nationalId = searchParams.get("nationalId");

    if (!nationalId || nationalId.length < 4) {
      return NextResponse.json(
        { error: "يرجى إدخال الرقم الوطني بشكل صحيح" },
        { status: 400 }
      );
    }

    // Find all participant records matching this national ID
    const participants = await db.participant.findMany({
      where: { nationalId: nationalId.trim() },
      include: {
        activity: {
          include: {
            sessions: { orderBy: { startTime: "asc" } },
            specialty: true,
            _count: { select: { participants: true } },
          },
        },
        attendances: {
          include: { session: true },
          where: { verified: true },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    if (participants.length === 0) {
      return NextResponse.json({
        found: false,
        message: "لا توجد سجلات بهذا الرقم الوطني",
        activities: [],
        totalCpd: 0,
      });
    }

    // Determine doctor's name & role from the most recent registration
    const fullName = participants[0].fullName;

    // Build activity list with computed CPD per activity
    const activities = participants.map((p) => {
      const verifiedCount = p.attendances.length;
      const totalSessions = p.activity.sessions.length;
      const activityCpd = p.attendances.reduce(
        (sum, a) => sum + (a.cpdAwarded || 0),
        0
      );

      // Determine eligible CPD based on role + participation type
      // Resident → 0
      // Practitioner-Participation → cpdPointsParticipation (HIGHER)
      // Practitioner-Attendance → cpdPoints (LOWER)
      let eligibleCpd = 0;
      if (p.role === "resident") {
        eligibleCpd = 0;
      } else if (p.role === "practitioner") {
        if (p.participationType === "participation") {
          eligibleCpd = p.activity.cpdPointsParticipation || 0;
        } else {
          // attendance (or default)
          eligibleCpd = p.activity.cpdPoints || 0;
        }
      }

      // If they didn't attend all sessions, scale the CPD
      const earnedCpd = totalSessions > 0 && verifiedCount > 0
        ? (eligibleCpd * verifiedCount) / totalSessions
        : 0;

      // Determine certificate eligibility
      // Cert can be issued if payment is approved AND:
      // - requiredCpdForCertificate = 0 → must verify all sessions
      // - requiredCpdForCertificate > 0 → earned CPD must be >= requiredCpdForCertificate
      const requiredCpd = (p.activity as any).requiredCpdForCertificate || 0;
      let canGetCertificate = false;
      if (p.paymentStatus === "approved") {
        if (requiredCpd > 0) {
          // Required CPD threshold - check if earned CPD meets the threshold
          canGetCertificate = earnedCpd >= requiredCpd;
        } else {
          // Default: must verify all sessions
          canGetCertificate = verifiedCount === totalSessions && totalSessions > 0;
        }
      }

      // Determine cert title and CPD on cert
      let certTitle = "شهادة حضور";
      let certCpd = 0;
      if (p.role === "resident") {
        certTitle = "شهادة حضور";
        certCpd = 0;
      } else if (p.role === "practitioner") {
        if (p.participationType === "participation") {
          certTitle = "شهادة مشاركة";
          certCpd = p.activity.cpdPointsParticipation || 0;
        } else {
          certTitle = "شهادة حضور";
          certCpd = p.activity.cpdPoints || 0;
        }
      }

      return {
        participantId: p.id,
        activity: {
          id: p.activity.id,
          title: p.activity.title,
          type: p.activity.type,
          typeName: p.activity.typeName,
          governorate: p.activity.governorate,
          location: p.activity.location,
          startDate: p.activity.startDate,
          endDate: p.activity.endDate,
          hoursCount: p.activity.hoursCount,
          daysCount: p.activity.daysCount,
          organizerName: p.activity.organizerName,
          organizerLogo: p.activity.organizerLogo,
          requiredCpdForCertificate: (p.activity as any).requiredCpdForCertificate || 0,
          specialty: p.activity.specialty ? {
            id: p.activity.specialty.id,
            name: p.activity.specialty.name,
            sliceName: p.activity.specialty.sliceName,
          } : null,
        },
        role: p.role,
        participationType: p.participationType,
        paymentStatus: p.paymentStatus,
        verifiedCount,
        totalSessions,
        activityCpd, // CPD actually earned from attendance
        eligibleCpd, // Maximum CPD eligible for this activity (full attendance)
        earnedCpd, // Scaled CPD based on actual attendance
        certTitle,
        certCpd,
        canGetCertificate,
        registeredAt: p.registeredAt,
      };
    });

    // Compute totals
    const totalCpdEarned = activities.reduce((sum, a) => sum + a.earnedCpd, 0);
    const totalActivities = activities.length;
    const totalCertificates = activities.filter((a) => a.canGetCertificate).length;
    const totalVerifiedSessions = activities.reduce((sum, a) => sum + a.verifiedCount, 0);

    return NextResponse.json({
      found: true,
      nationalId: nationalId.trim(),
      fullName,
      activities,
      totalCpd: totalCpdEarned,
      totalActivities,
      totalCertificates,
      totalVerifiedSessions,
    });
  } catch (e) {
    return NextResponse.json({ error: "فشل في البحث" }, { status: 500 });
  }
}
