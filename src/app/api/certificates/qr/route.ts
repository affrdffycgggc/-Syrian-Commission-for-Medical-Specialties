import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";

// GET: Generate QR code for a certificate
// Query: participantId - generates a QR code containing certificate verification info
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

    // Build verification data
    const verifiedCount = participant.attendances.length;
    const totalCpd = participant.attendances.reduce((sum, a) => sum + a.cpdAwarded, 0);

    // Certificate verification data (encoded in QR)
    const certData = {
      participantId: participant.id,
      participantName: participant.fullName,
      nationalId: participant.nationalId,
      role: participant.role,
      participationType: participant.participationType,
      activityTitle: participant.activity.title,
      activityType: participant.activity.typeName,
      governorate: participant.activity.governorate,
      location: participant.activity.location,
      startDate: new Date(participant.activity.startDate).toISOString().slice(0, 10),
      endDate: new Date(participant.activity.endDate).toISOString().slice(0, 10),
      verifiedSessions: verifiedCount,
      totalCpd: totalCpd,
      certRef: `CERT-${participant.id.slice(-8).toUpperCase()}`,
      issuedAt: new Date().toISOString().slice(0, 10),
      // Hash for verification (simple - in production use cryptographic signature)
      verifyHash: Buffer.from(`${participant.id}:${participant.activity.id}:${totalCpd}`).toString("base64").slice(0, 16),
    };

    // Generate QR code as data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(certData), {
      width: 300,
      margin: 1,
      color: {
        dark: "#065f46", // emerald-800
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    return NextResponse.json({
      ok: true,
      qrCode: qrDataUrl,
      certRef: certData.certRef,
      verifyHash: certData.verifyHash,
      certData,
    });
  } catch (e) {
    return NextResponse.json({ error: "فشل في توليد QR code" }, { status: 500 });
  }
}
