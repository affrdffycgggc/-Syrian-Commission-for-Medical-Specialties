import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: Get single certificate template (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await db.certificateTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch (e) {
    return NextResponse.json({ error: "فشل في الجلب" }, { status: 500 });
  }
}

// PUT: Update template (admin only)
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

    const updated = await db.certificateTemplate.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ ok: true, template: updated });
  } catch (e) {
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}

// DELETE: Delete template (admin only)
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
    await db.certificateTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "فشل في الحذف" }, { status: 500 });
  }
}
