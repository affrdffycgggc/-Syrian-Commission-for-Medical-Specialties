import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: Get a single payment request with full details (admin only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ok } = await checkAdmin().then((isAdmin) => ({ ok: isAdmin }));
    if (!ok) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    const { id } = await params;
    const request = await db.paymentRequest.findUnique({
      where: { id },
      include: {
        participant: {
          include: { activity: true },
        },
        paymentMethod: true,
      },
    });
    if (!request) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ request });
  } catch (e) {
    return NextResponse.json({ error: "فشل في جلب الطلب" }, { status: 500 });
  }
}

// PUT: Approve or reject a payment request (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول كمدير" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const { action, adminNote } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 });
    }

    const request = await db.paymentRequest.findUnique({
      where: { id },
      include: { participant: { include: { activity: true } } },
    });
    if (!request) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (request.status !== "pending") {
      return NextResponse.json({
        error: `تم مراجعة هذا الطلب مسبقاً (الحالة الحالية: ${request.status})`,
      }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const updated = await db.paymentRequest.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: adminNote || null,
        reviewedBy: 'admin',
        reviewedAt: new Date(),
      },
    });

    if (action === "approve") {
      const paymentRef = `PAY-${Date.now().toString(36).toUpperCase()}-${id.slice(-4).toUpperCase()}`;
      await db.participant.update({
        where: { id: request.participantId },
        data: {
          paymentStatus: "approved",
          paymentMethod: request.paymentMethodId,
          paymentRef,
          paidAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        request: updated,
        action: "approved",
        message: "تمت الموافقة على طلب الدفع. يمكن للمستخدم متابعة التحقق من الموقع والحضور",
      });
    } else {
      await db.participant.update({
        where: { id: request.participantId },
        data: {
          paymentStatus: "rejected",
        },
      });

      return NextResponse.json({
        ok: true,
        request: updated,
        action: "rejected",
        message: "تم رفض طلب الدفع. يمكن للمستخدم إرسال طلب جديد",
      });
    }
  } catch (e) {
    return NextResponse.json({ error: "فشل في تحديث الطلب" }, { status: 500 });
  }
}
