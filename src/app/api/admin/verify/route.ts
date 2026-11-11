import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const cookieStore = await import("next/headers").then(m => m.cookies());
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Decode token (supports both hex and base64 formats)
    let adminId: string | null = null;
    try {
      const decoded = Buffer.from(token, "hex").toString("utf-8");
      if (decoded.includes(":")) adminId = decoded.split(":")[0];
    } catch {}
    if (!adminId) {
      try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        if (decoded.includes(":")) adminId = decoded.split(":")[0];
      } catch {}
    }
    if (!adminId) {
      try {
        const urlDecoded = decodeURIComponent(token);
        const decoded = Buffer.from(urlDecoded, "base64").toString("utf-8");
        if (decoded.includes(":")) adminId = decoded.split(":")[0];
      } catch {}
    }

    if (!adminId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const admin = await db.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true },
    });
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, admin });
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
