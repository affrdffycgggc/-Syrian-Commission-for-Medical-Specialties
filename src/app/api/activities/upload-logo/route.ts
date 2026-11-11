import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { checkAdmin } from "@/lib/auth";

// POST: Upload organizer logo from local computer (admin only)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "لم يتم رفع أي ملف" }, { status: 400 });
    }

    // SECURITY: Validate file type (NO SVG to prevent script-in-SVG XSS)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. يُسمح فقط بصور JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Max size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "organizers");
    await fs.mkdir(uploadDir, { recursive: true });

    // SECURITY: Generate safe filename from validated MIME type (not user-supplied)
    const ext = `.${file.type.split("/")[1] || "png"}`;
    const fileName = `organizer-${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/organizers/${fileName}`,
      fileName,
      size: file.size,
    });
  } catch (e) {
    return NextResponse.json({ error: "فشل في رفع الملف" }, { status: 500 });
  }
}
