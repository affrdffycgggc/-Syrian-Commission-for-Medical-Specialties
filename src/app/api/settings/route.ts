import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

// GET: Get current settings (public)
export async function GET() {
  try {
    let settings = await db.systemSetting.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await db.systemSetting.create({
        data: {
          id: "singleton",
          paymentEnabled: true,
          maintenanceMode: false,
          manualPaymentInstructions: null,
        },
      });
    }
    return NextResponse.json({
      paymentEnabled: settings.paymentEnabled,
      maintenanceMode: settings.maintenanceMode,
      manualPaymentInstructions: settings.manualPaymentInstructions,
    });
  } catch (e) {
    return NextResponse.json({ paymentEnabled: true, maintenanceMode: false });
  }
}

// PUT: Update settings (admin only)
export async function PUT(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentEnabled, maintenanceMode, manualPaymentInstructions } = body;

    const settings = await db.systemSetting.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        paymentEnabled: paymentEnabled !== undefined ? paymentEnabled : true,
        maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : false,
        manualPaymentInstructions: manualPaymentInstructions || null,
      },
      update: {
        paymentEnabled: paymentEnabled !== undefined ? paymentEnabled : undefined,
        maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : undefined,
        manualPaymentInstructions: manualPaymentInstructions !== undefined ? manualPaymentInstructions : undefined,
      },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json({ error: "فشل في تحديث الإعدادات" }, { status: 500 });
  }
}
