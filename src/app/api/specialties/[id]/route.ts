import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// PUT: Update specialty (admin only)
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
    const { name, slice, sliceName, isActive } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (slice !== undefined) data.slice = slice;
    if (sliceName !== undefined) data.sliceName = sliceName.trim();
    if (isActive !== undefined) data.isActive = !!isActive;

    const updated = await db.specialty.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, specialty: updated });
  } catch (e) {
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}

// DELETE: Delete specialty (admin only)
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

    // Check if any activity uses this specialty
    const count = await db.activity.count({ where: { specialtyId: id } });
    if (count > 0) {
      // Soft delete - mark as inactive
      await db.specialty.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        ok: true,
        softDelete: true,
        message: "تم إيقاف الاختصاص لوجود نشاطات مرتبطة به",
      });
    }

    await db.specialty.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "فشل في الحذف" }, { status: 500 });
  }
}
