import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentEmail, currentPassword, newEmail, newName, newPassword } = body;

    if (!currentEmail || !currentPassword) {
      return NextResponse.json({ error: "يرجى إدخال البريد وكلمة المرور الحالية" }, { status: 400 });
    }

    const admin = await db.admin.findUnique({ where: { email: currentEmail } });
    if (!admin) {
      return NextResponse.json({ error: "البيانات الحالية غير صحيحة" }, { status: 401 });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return NextResponse.json({ error: "البيانات الحالية غير صحيحة" }, { status: 401 });
    }

    const updateData: any = {};
    if (newEmail && newEmail.trim()) {
      const existing = await db.admin.findUnique({ where: { email: newEmail } });
      if (existing && existing.id !== admin.id) {
        return NextResponse.json({ error: "البريد الجديد مستخدم بالفعل" }, { status: 400 });
      }
      updateData.email = newEmail.trim();
    }
    if (newName && newName.trim()) {
      updateData.name = newName.trim();
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "لا توجد تغييرات للحفظ" }, { status: 400 });
    }

    await db.admin.update({ where: { id: admin.id }, data: updateData });

    return NextResponse.json({ ok: true, message: "تم تحديث البيانات بنجاح" });
  } catch (e) {
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}
