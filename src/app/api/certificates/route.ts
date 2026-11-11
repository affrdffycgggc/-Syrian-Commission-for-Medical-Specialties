import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { checkAdmin } from "@/lib/auth";

// SECURITY: Allowed file types for certificate logos
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
// SECURITY: Max file size 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// GET: Generate a certificate for a participant
// Query: participantId - finds the matching template based on role + participationType
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
        activity: { include: { specialty: true } },
        attendances: { include: { session: true }, where: { verified: true } },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "المشارك غير موجود" }, { status: 404 });
    }

    if (participant.paymentStatus !== "approved") {
      return NextResponse.json({ error: "لم تتم الموافقة على الدفع بعد" }, { status: 400 });
    }

    const sessionCount = await db.session.count({ where: { activityId: participant.activityId } });
    if (sessionCount === 0) {
      return NextResponse.json({ error: "لا توجد جلسات في النشاط" }, { status: 400 });
    }

    if (participant.attendances.length === 0) {
      return NextResponse.json({ error: "لا يوجد حضور مسجل" }, { status: 400 });
    }

    // Check certificate eligibility based on requiredCpdForCertificate
    const requiredCpd = (participant.activity as any).requiredCpdForCertificate || 0;
    const verifiedCount = participant.attendances.length;
    const totalSessions = sessionCount;

    if (requiredCpd > 0) {
      // Calculate earned CPD
      const totalEarnedCpd = participant.attendances.reduce((sum, a) => sum + a.cpdAwarded, 0);
      if (totalEarnedCpd < requiredCpd) {
        return NextResponse.json({
          error: `لم تجتاز النقاط المطلوبة. حصلت على ${totalEarnedCpd.toFixed(1)} نقطة، المطلوب ${requiredCpd} نقطة`,
        }, { status: 400 });
      }
    } else {
      // Default: must verify all sessions
      if (verifiedCount < totalSessions) {
        return NextResponse.json({
          error: `يجب إكمال جميع الجلسات. أكملت ${verifiedCount} من ${totalSessions} جلسة`,
        }, { status: 400 });
      }
    }

    // Find matching certificate template
    let templateWhere: any = {
      isActive: true,
      roleType: participant.role,
    };

    if (participant.role === "practitioner") {
      templateWhere.participationType = participant.participationType || "attendance";
    } else {
      // Resident
      templateWhere.participationType = null;
    }

    let template = await db.certificateTemplate.findFirst({
      where: templateWhere,
    });

    // If no specific template, fall back to any matching by role
    if (!template) {
      template = await db.certificateTemplate.findFirst({
        where: { isActive: true, roleType: participant.role },
      });
    }

    // If still no template, use defaults
    const useDefaults = !template;

    // Calculate CPD points based on role + participation type
    // Resident → 0 (no CPD on certificate)
    // Practitioner-Participation → cpdPointsParticipation (HIGHER, more active involvement)
    // Practitioner-Attendance → cpdPoints (LOWER, passive attendance)
    let totalCpd = 0;
    let certTitle = "شهادة حضور";
    let certCpd = 0;

    if (participant.role === "resident") {
      totalCpd = 0;
      certTitle = "شهادة حضور";
      certCpd = 0;
    } else if (participant.role === "practitioner") {
      if (participant.participationType === "participation") {
        // Participation: HIGHER CPD
        totalCpd = participant.activity.cpdPointsParticipation || 0;
        certTitle = "شهادة مشاركة";
        certCpd = participant.activity.cpdPointsParticipation || 0;
      } else {
        // attendance: LOWER CPD
        totalCpd = participant.activity.cpdPoints || 0;
        certTitle = "شهادة حضور";
        certCpd = participant.activity.cpdPoints || 0;
      }
    }

    // Format dates
    const formatDate = (d: Date) => {
      try {
        return new Intl.DateTimeFormat("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(d));
      } catch {
        return new Date(d).toLocaleDateString();
      }
    };

    const dateFrom = formatDate(participant.activity.startDate);
    const dateTo = formatDate(participant.activity.endDate);

    // Supporting logos array
    let supportingLogosArray: string[] = [];
    try {
      if (participant.activity.supportingLogos) {
        supportingLogosArray = JSON.parse(participant.activity.supportingLogos);
      }
    } catch {}

    // Replace placeholders in body text
    const bodyText = template?.bodyText ||
      "تشهد الهيئة السورية للاختصاصات الطبية بأن المشارك/ة المذكور/ة أدناه قد {participationVerb} في النشاط التالي:";
    const participationVerb = participant.participationType === "participation"
      ? "شارك"
      : participant.role === "resident"
      ? "حضر"
      : "حضر";

    // Format time period
    const formatTime = (d: Date) => {
      try {
        return new Intl.DateTimeFormat("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(d));
      } catch {
        return new Date(d).toLocaleTimeString();
      }
    };
    const timeFrom = formatTime(participant.activity.startDate);
    const timeTo = formatTime(participant.activity.endDate);
    const timePeriod = participant.activity.timePeriod || `${timeFrom} - ${timeTo}`;

    const finalBodyText = bodyText
      .replace(/\{participantName\}/g, participant.fullName)
      .replace(/\{nationalId\}/g, participant.nationalId)
      .replace(/\{activityType\}/g, participant.activity.typeName || participant.activity.type)
      .replace(/\{activityName\}/g, participant.activity.title)
      .replace(/\{governorate\}/g, participant.activity.governorate || "")
      .replace(/\{location\}/g, participant.activity.location)
      .replace(/\{dateFrom\}/g, dateFrom)
      .replace(/\{dateTo\}/g, dateTo)
      .replace(/\{timeFrom\}/g, timeFrom)
      .replace(/\{timeTo\}/g, timeTo)
      .replace(/\{timePeriod\}/g, timePeriod)
      .replace(/\{daysCount\}/g, String(participant.activity.daysCount || 1))
      .replace(/\{cpdPoints\}/g, certCpd.toFixed(1))
      .replace(/\{hoursCount\}/g, String(participant.activity.hoursCount || 0))
      .replace(/\{participationVerb\}/g, participationVerb)
      .replace(/\{specialty\}/g, participant.activity.specialty?.name || "")
      .replace(/\{organizerName\}/g, participant.activity.organizerName || "");

    const certData = {
      participantId: participant.id,
      participantName: participant.fullName,
      nationalId: participant.nationalId,
      role: participant.role,
      participationType: participant.participationType,
      activity: {
        title: participant.activity.title,
        type: participant.activity.type,
        typeName: participant.activity.typeName,
        governorate: participant.activity.governorate,
        location: participant.activity.location,
        startDate: participant.activity.startDate,
        endDate: participant.activity.endDate,
        timePeriod: timePeriod,
        hoursCount: participant.activity.hoursCount,
        daysCount: participant.activity.daysCount,
        organizerName: participant.activity.organizerName,
        organizerLogo: participant.activity.organizerLogo,
        specialty: participant.activity.specialty,
        supportingLogos: supportingLogosArray,
      },
      certificate: {
        title: template?.certTitle || certTitle,
        subtitle: template?.certSubtitle || null,
        headerText: template?.headerText || "الهيئة السورية للاختصاصات الطبية",
        bodyText: finalBodyText,
        footerText: template?.footerText || "صادرة عن الهيئة السورية للاختصاصات الطبية",
        signatureText: template?.signatureText || "التوقيع",
        signatureImage: template?.signatureImage || null,
        authorityLogo: template?.authorityLogo || "/logo-original.jpg",
        authorityName: template?.authorityName || "الهيئة السورية للاختصاصات الطبية",
        organizerLogo: template?.organizerLogo || participant.activity.organizerLogo,
        organizerName: template?.organizerName || participant.activity.organizerName,
        supportingLogos: template?.supportingLogos ? (() => {
          try { return JSON.parse(template.supportingLogos as string); } catch { return []; }
        })() : [],
        showCpdPoints: template?.showCpdPoints !== undefined ? template.showCpdPoints : (participant.role !== "resident"),
        backgroundColor: template?.backgroundColor || "#ffffff",
        borderColor: template?.borderColor || "#10b981",
      },
      cpd: {
        totalCpd,
        certCpd,
        showCpd: participant.role !== "resident",
      },
      verifiedSessions: participant.attendances.length,
      totalSessions: sessionCount,
      templateFound: !useDefaults,
    };

    return NextResponse.json({ ok: true, certificate: certData });
  } catch (e) {
    return NextResponse.json({ error: "فشل في إنشاء الشهادة" }, { status: 500 });
  }
}

// POST: Upload a logo for use in certificate templates (admin only)
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require admin auth
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // 'authority' | 'organizer' | 'supporting' | 'signature'

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "لم يتم رفع أي ملف" }, { status: 400 });
    }

    // SECURITY: Validate file type (no SVG to prevent script-in-SVG XSS)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. يُسمح فقط بصور PNG, JPG, WebP, GIF" },
        { status: 400 }
      );
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "certificates");
    await fs.mkdir(uploadDir, { recursive: true });

    // SECURITY: Generate safe filename from validated MIME type (not user-supplied)
    const ext = `.${file.type.split("/")[1] || "png"}`;
    const fileName = `${type || "logo"}-${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/certificates/${fileName}`,
      fileName,
      size: file.size,
    });
  } catch (e) {
    return NextResponse.json({ error: "فشل في رفع الملف" }, { status: 500 });
  }
}
