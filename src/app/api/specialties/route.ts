import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: List all specialties (public) - optionally filtered by slice
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slice = searchParams.get("slice");

    const where: any = { isActive: true };
    if (slice && slice !== "all") {
      where.slice = slice;
    }

    const specialties = await db.specialty.findMany({
      where,
      orderBy: [{ slice: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ specialties });
  } catch (e) {
    return NextResponse.json({ error: "فشل في جلب الاختصاصات" }, { status: 500 });
  }
}

// POST: Create new specialty (admin only)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slice, sliceName } = body;

    if (!name || !slice || !sliceName) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول (الاسم، الشريحة، اسم الشريحة)" },
        { status: 400 }
      );
    }

    const existing = await db.specialty.findUnique({
      where: { slice_name: { slice, name } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "الاختصاص موجود مسبقاً في هذه الشريحة" },
        { status: 400 }
      );
    }

    const specialty = await db.specialty.create({
      data: { name: name.trim(), slice, sliceName: sliceName.trim() },
    });

    return NextResponse.json({ ok: true, specialty });
  } catch (e) {
    return NextResponse.json({ error: "فشل في إنشاء الاختصاص" }, { status: 500 });
  }
}

// PUT: Bulk update (admin only) - used for seeding defaults
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { specialties } = body as { specialties: Array<{ name: string; slice: string; sliceName: string }> };

    if (!specialties || !Array.isArray(specialties)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    let created = 0;
    for (const s of specialties) {
      if (!s.name || !s.slice || !s.sliceName) continue;
      const existing = await db.specialty.findUnique({
        where: { slice_name: { slice: s.slice, name: s.name } },
      });
      if (!existing) {
        await db.specialty.create({
          data: { name: s.name.trim(), slice: s.slice, sliceName: s.sliceName.trim() },
        });
        created++;
      }
    }

    return NextResponse.json({ ok: true, created, total: specialties.length });
  } catch (e) {
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}
