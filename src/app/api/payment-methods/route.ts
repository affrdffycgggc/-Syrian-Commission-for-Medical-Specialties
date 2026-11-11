import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { checkAdmin } from "@/lib/auth";

// GET: List all payment methods (public - only active ones; admin sees all if includeInactive=true)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    let where: any = { isActive: true };
    if (includeInactive) {
      where = {};
    }

    const methods = await db.paymentMethod.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ methods });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في جلب طرق الدفع" }, { status: 500 });
  }
}

// POST: Create new payment method (admin only)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const walletCode = (formData.get("walletCode") as string) || "";
    const walletName = (formData.get("walletName") as string) || "";
    const instructions = (formData.get("instructions") as string) || "";
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0");
    const isManual = formData.get("isManual") === "true";

    if (!name) {
      return NextResponse.json({ error: "اسم الطريقة مطلوب" }, { status: 400 });
    }

    let imagePath: string | null = null;
    let qrCodePath: string | null = null;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "payment-methods");
    await fs.mkdir(uploadDir, { recursive: true });

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const ext = path.extname(imageFile.name) || ".png";
      const fileName = `pm-${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      imagePath = `/uploads/payment-methods/${fileName}`;
    }

    const qrFile = formData.get("qrCode") as File | null;
    if (qrFile && qrFile.size > 0) {
      const ext = path.extname(qrFile.name) || ".png";
      const fileName = `qr-${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await qrFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      qrCodePath = `/uploads/payment-methods/${fileName}`;
    }

    const method = await db.paymentMethod.create({
      data: {
        name,
        description,
        image: imagePath,
        qrCode: qrCodePath,
        walletCode,
        walletName,
        instructions,
        isManual,
        displayOrder,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, method });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في إنشاء طريقة الدفع" }, { status: 500 });
  }
}
