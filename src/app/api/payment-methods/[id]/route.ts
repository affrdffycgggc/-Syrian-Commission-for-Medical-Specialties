import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { checkAdmin } from "@/lib/auth";

// PUT: Update payment method (admin only)
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
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const walletCode = (formData.get("walletCode") as string) || "";
    const walletName = (formData.get("walletName") as string) || "";
    const instructions = (formData.get("instructions") as string) || "";
    const displayOrder = parseInt((formData.get("displayOrder") as string) || "0");
    const isActive = formData.get("isActive") === "true";
    const isManual = formData.get("isManual") === "true";

    const updateData: any = {
      description,
      walletCode,
      walletName,
      instructions,
      displayOrder,
      isActive,
      isManual,
    };
    if (name) updateData.name = name;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "payment-methods");
    await fs.mkdir(uploadDir, { recursive: true });

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const ext = path.extname(imageFile.name) || ".png";
      const fileName = `pm-${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      updateData.image = `/uploads/payment-methods/${fileName}`;
    }

    const qrFile = formData.get("qrCode") as File | null;
    if (qrFile && qrFile.size > 0) {
      const ext = path.extname(qrFile.name) || ".png";
      const fileName = `qr-${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await qrFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      updateData.qrCode = `/uploads/payment-methods/${fileName}`;
    }

    const method = await db.paymentMethod.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, method });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في التحديث" }, { status: 500 });
  }
}

// DELETE: Delete payment method (admin only)
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

    const requestCount = await db.paymentRequest.count({
      where: { paymentMethodId: id },
    });
    if (requestCount > 0) {
      await db.paymentMethod.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        ok: true,
        message: "تم إلغاء تفعيل الطريقة لوجود طلبات مرتبطة بها",
        softDeleted: true,
      });
    }

    await db.paymentMethod.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // silent;
    return NextResponse.json({ error: "فشل في الحذف" }, { status: 500 });
  }
}
