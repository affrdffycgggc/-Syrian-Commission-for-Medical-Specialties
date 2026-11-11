import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: List all certificate templates (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleType = searchParams.get("roleType");
    const participationType = searchParams.get("participationType");

    const where: any = { isActive: true };
    if (roleType) where.roleType = roleType;
    if (participationType) where.participationType = participationType;

    const templates = await db.certificateTemplate.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (e) {
    return NextResponse.json({ error: "فشل في جلب النماذج" }, { status: 500 });
  }
}

// POST: Create new certificate template (admin only)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      roleType,
      participationType,
      certTitle,
      certSubtitle,
      authorityLogo,
      authorityName,
      organizerLogo,
      organizerName,
      supportingLogos,
      headerText,
      bodyText,
      footerText,
      signatureText,
      signatureImage,
      showCpdPoints,
      backgroundColor,
      borderColor,
    } = body;

    if (!name || !roleType || !certTitle || !bodyText) {
      return NextResponse.json(
        { error: "يرجى تعبئة الحقول المطلوبة" },
        { status: 400 }
      );
    }

    if (roleType !== "resident" && roleType !== "practitioner") {
      return NextResponse.json({ error: "نوع الطبيب غير صحيح" }, { status: 400 });
    }

    if (roleType === "practitioner" && participationType && !["participation", "attendance"].includes(participationType)) {
      return NextResponse.json({ error: "نوع المشاركة غير صحيح" }, { status: 400 });
    }

    const template = await db.certificateTemplate.create({
      data: {
        name,
        roleType,
        participationType: participationType || null,
        certTitle,
        certSubtitle: certSubtitle || null,
        authorityLogo: authorityLogo || null,
        authorityName: authorityName || null,
        organizerLogo: organizerLogo || null,
        organizerName: organizerName || null,
        supportingLogos: supportingLogos || null,
        headerText: headerText || null,
        bodyText,
        footerText: footerText || null,
        signatureText: signatureText || null,
        signatureImage: signatureImage || null,
        showCpdPoints: showCpdPoints !== undefined ? !!showCpdPoints : true,
        backgroundColor: backgroundColor || "#ffffff",
        borderColor: borderColor || "#10b981",
      },
    });

    return NextResponse.json({ ok: true, template });
  } catch (e) {
    return NextResponse.json({ error: "فشل في إنشاء النموذج" }, { status: 500 });
  }
}

// PUT: Bulk seed default templates (admin only)
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { templates } = body;

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    for (const t of templates) {
      // Find existing template by role + participation
      const existing = await db.certificateTemplate.findFirst({
        where: {
          roleType: t.roleType,
          participationType: t.participationType || null,
        },
      });
      if (existing) {
        await db.certificateTemplate.update({
          where: { id: existing.id },
          data: { ...t, participationType: t.participationType || null },
        });
        updated++;
      } else {
        await db.certificateTemplate.create({
          data: { ...t, participationType: t.participationType || null },
        });
        created++;
      }
    }

    return NextResponse.json({ ok: true, created, updated });
  } catch (e) {
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}
