import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { checkAdmin } from "@/lib/auth";

// GET: List all payment requests (admin only) - with filter by status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const requests = await db.paymentRequest.findMany({
      where,
      include: {
        participant: {
          select: {
            id: true,
            nationalId: true,
            fullName: true,
            role: true,
            participationType: true,
            activity: { select: { id: true, title: true, fee: true, residentFee: true, cpdPoints: true, cpdPointsParticipation: true } },
          },
        },
        paymentMethod: { select: { id: true, name: true, walletCode: true, isManual: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const stats = {
      total: await db.paymentRequest.count(),
      pending: await db.paymentRequest.count({ where: { status: "pending" } }),
      approved: await db.paymentRequest.count({ where: { status: "approved" } }),
      rejected: await db.paymentRequest.count({ where: { status: "rejected" } }),
    };

    return NextResponse.json({ requests, stats });
  } catch (e) {
    return NextResponse.json({ error: "فشل في جلب الطلبات" }, { status: 500 });
  }
}

// POST: Submit new payment request (user side) - supports receipt image upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const participantId = formData.get("participantId") as string;
    const activityId = formData.get("activityId") as string;
    const paymentMethodId = formData.get("paymentMethodId") as string;
    const operationNumber = (formData.get("operationNumber") as string) || "";
    const amount = parseFloat((formData.get("amount") as string) || "0");

    if (!participantId || !activityId || !paymentMethodId || amount <= 0) {
      return NextResponse.json(
        { error: "بيانات ناقصة. يرجى تعبئة جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    // Get the payment method to check if it's manual
    const method = await db.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });
    if (!method || !method.isActive) {
      return NextResponse.json({ error: "طريقة الدفع غير متاحة" }, { status: 400 });
    }

    // For non-manual methods, operation number is required
    if (!method.isManual && (!operationNumber || operationNumber.trim().length < 3)) {
      return NextResponse.json(
        { error: "رقم العملية غير صحيح" },
        { status: 400 }
      );
    }

    const participant = await db.participant.findUnique({
      where: { id: participantId },
      include: { activity: true },
    });
    if (!participant) {
      return NextResponse.json({ error: "المشارك غير موجود" }, { status: 404 });
    }

    // Determine the applicable fee based on role
    const applicableFee = participant.role === "resident"
      ? participant.activity.residentFee
      : participant.activity.fee;

    if (participant.paymentStatus === "approved") {
      return NextResponse.json({
        ok: true,
        alreadyApproved: true,
        message: "تمت الموافقة على دفعك مسبقاً",
        participant,
      });
    }

    // Validate the amount matches the applicable fee (with small tolerance)
    if (Math.abs(amount - applicableFee) > 0.01) {
      return NextResponse.json({
        error: `المبلغ المدفوع (${amount.toLocaleString("ar-EG")} ل.س) لا يطابق الرسوم المطلوبة (${applicableFee.toLocaleString("ar-EG")} ل.س)`,
      }, { status: 400 });
    }

    const existingPending = await db.paymentRequest.findFirst({
      where: { participantId, status: "pending" },
    });
    if (existingPending) {
      return NextResponse.json({
        ok: true,
        existingPending: true,
        request: existingPending,
        message: "لديك طلب دفع قيد المراجعة بالفعل",
      });
    }

    // Handle receipt image upload (for manual methods)
    let receiptImagePath: string | null = null;
    const receiptFile = formData.get("receiptImage") as File | null;
    if (receiptFile && receiptFile.size > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
      await fs.mkdir(uploadDir, { recursive: true });
      const ext = path.extname(receiptFile.name) || ".png";
      const fileName = `receipt-${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      receiptImagePath = `/uploads/receipts/${fileName}`;
    }

    // For manual methods, receipt image is required
    if (method.isManual && !receiptImagePath) {
      return NextResponse.json(
        { error: "يرجى رفع صورة الإيصال للطرق اليدوية" },
        { status: 400 }
      );
    }

    const request = await db.paymentRequest.create({
      data: {
        participantId,
        activityId,
        paymentMethodId,
        operationNumber: operationNumber.trim() || null,
        amount,
        receiptImage: receiptImagePath,
        status: "pending",
      },
    });

    // Update participant status and receipt image
    await db.participant.update({
      where: { id: participantId },
      data: {
        paymentStatus: "awaiting_approval",
        receiptImage: receiptImagePath,
      },
    });

    return NextResponse.json({
      ok: true,
      request,
      message: "تم إرسال طلب الدفع بنجاح. سيتم مراجعته من قبل الإدارة",
    });
  } catch (e) {
    return NextResponse.json({ error: "فشل في إرسال الطلب" }, { status: 500 });
  }
}
