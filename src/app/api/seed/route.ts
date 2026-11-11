import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const DEFAULT_SPECIALTIES = [
  // طب بشري
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض قلبية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض باطنية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض صدرية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جراحة عامة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جراحة عظمية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أطفال" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "نسائية وتوليد" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "عيون" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أنف وأذن وحنجرة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جلدية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "بولية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "عصبية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "نفسية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "تخدير" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "طوارئ" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أشعة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض معدية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "غدد صماء" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جهاز هضمي" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "كلى" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أورام" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "طب أسرة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "طب مجتمع" },
  // طب أسنان
  { slice: "dentistry", sliceName: "طب أسنان", name: "تقويم" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "علاج جذور" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "تركيبات" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "جراحة فم وأسنان" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "أطفال أسنان" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "لثة" },
  // صيدلة
  { slice: "pharmacy", sliceName: "صيدلة", name: "صيدلة سريرية" },
  { slice: "pharmacy", sliceName: "صيدلة", name: "صيدلة صناعية" },
  { slice: "pharmacy", sliceName: "صيدلة", name: "عقاقير" },
  // تمريض
  { slice: "nursing", sliceName: "تمريض", name: "تمريض عام" },
  { slice: "nursing", sliceName: "تمريض", name: "تمريض رعاية مكثفة" },
  { slice: "nursing", sliceName: "تمريض", name: "تمريض أطفال" },
  // علوم مختبرية
  { slice: "lab", sliceName: "علوم مختبرية", name: "تحاليل طبية" },
  { slice: "lab", sliceName: "علوم مختبرية", name: "أحياء دقيقة" },
  { slice: "lab", sliceName: "علوم مختبرية", name: "كيمياء حيوية" },
  // طب بيطري
  { slice: "veterinary", sliceName: "طب بيطري", name: "طب بيطري عام" },
  // هندسة طبية حيوية
  { slice: "engineering", sliceName: "هندسة طبية حيوية", name: "أجهزة طبية" },
];

const DEFAULT_CERTIFICATE_TEMPLATES = [
  {
    name: "نموذج المقيم (حضور - بدون CPD)",
    roleType: "resident",
    participationType: null,
    certTitle: "شهادة حضور",
    certSubtitle: "تصديقاً للحضور",
    headerText: "الهيئة السورية للاختصاصات الطبية",
    bodyText: "تشهد الهيئة السورية للاختصاصات الطبية بأن الطبيب المقيم {participantName} (الرقم الوطني: {nationalId}) قد حضر في {activityType} التالي:",
    footerText: "صادرة عن الهيئة السورية للاختصاصات الطبية - بدون نقاط CPD",
    signatureText: "رئيس الهيئة",
    showCpdPoints: false,
    backgroundColor: "#ffffff",
    borderColor: "#10b981",
    authorityLogo: "/logo-original.jpg",
    authorityName: "الهيئة السورية للاختصاصات الطبية",
    organizerLogo: null,
    organizerName: null,
    supportingLogos: null,
    signatureImage: null,
  },
  {
    name: "نموذج الممارس - مشاركة (نقاط CPD عالية)",
    roleType: "practitioner",
    participationType: "participation",
    certTitle: "شهادة مشاركة",
    certSubtitle: "تصديقاً للمشاركة",
    headerText: "الهيئة السورية للاختصاصات الطبية",
    bodyText: "تشهد الهيئة السورية للاختصاصات الطبية بأن الطبيب الممارس {participantName} (الرقم الوطني: {nationalId}) قد شارك في {activityType} التالي:",
    footerText: "صادرة عن الهيئة السورية للاختصاصات الطبية",
    signatureText: "رئيس الهيئة",
    showCpdPoints: true,
    backgroundColor: "#ffffff",
    borderColor: "#0ea5e9",
    authorityLogo: "/logo-original.jpg",
    authorityName: "الهيئة السورية للاختصاصات الطبية",
    organizerLogo: null,
    organizerName: null,
    supportingLogos: null,
    signatureImage: null,
  },
  {
    name: "نموذج الممارس - حضور (نقاط CPD أقل من المشاركة)",
    roleType: "practitioner",
    participationType: "attendance",
    certTitle: "شهادة حضور",
    certSubtitle: "تصديقاً للحضور",
    headerText: "الهيئة السورية للاختصاصات الطبية",
    bodyText: "تشهد الهيئة السورية للاختصاصات الطبية بأن الطبيب الممارس {participantName} (الرقم الوطني: {nationalId}) قد حضر في {activityType} التالي:",
    footerText: "صادرة عن الهيئة السورية للاختصاصات الطبية",
    signatureText: "رئيس الهيئة",
    showCpdPoints: true,
    backgroundColor: "#ffffff",
    borderColor: "#f59e0b",
    authorityLogo: "/logo-original.jpg",
    authorityName: "الهيئة السورية للاختصاصات الطبية",
    organizerLogo: null,
    organizerName: null,
    supportingLogos: null,
    signatureImage: null,
  },
];

// Helper: create admin from env vars (with fallback for development)
async function ensureAdmin() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "activities-system@gmail.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "activities-system12345@";
  const ADMIN_NAME = process.env.ADMIN_NAME || "مدير النظام";

  const existingAdmin = await db.admin.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.admin.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: hashedPassword,
      },
    });
    return true; // created
  }
  return false; // already exists, do NOT reset password
}

// GET: Auto-setup everything: admin + settings + specialties + certificate templates
// This endpoint is idempotent - it only CREATES missing data, never overwrites or leaks credentials
export async function GET() {
  try {
    let adminCreated = false;
    let specialtiesCreated = 0;
    let templatesCreated = 0;

    // 1. Create admin if not exists (NEVER reset existing admin, NEVER return credentials)
    adminCreated = await ensureAdmin();

    // 2. Create default system settings
    const existingSettings = await db.systemSetting.count();
    if (existingSettings === 0) {
      await db.systemSetting.create({
        data: {
          id: "singleton",
          paymentEnabled: true,
          maintenanceMode: false,
          manualPaymentInstructions: null,
        },
      });
    }

    // 3. Seed default specialties (auto, idempotent)
    for (const s of DEFAULT_SPECIALTIES) {
      const existing = await db.specialty.findUnique({
        where: { slice_name: { slice: s.slice, name: s.name } },
      });
      if (!existing) {
        await db.specialty.create({
          data: { name: s.name, slice: s.slice, sliceName: s.sliceName },
        });
        specialtiesCreated++;
      }
    }

    // 4. Seed default certificate templates (auto, idempotent)
    for (const t of DEFAULT_CERTIFICATE_TEMPLATES) {
      const existing = await db.certificateTemplate.findFirst({
        where: {
          roleType: t.roleType,
          participationType: t.participationType,
        },
      });
      if (!existing) {
        await db.certificateTemplate.create({ data: t });
        templatesCreated++;
      }
    }

    // SECURITY: Never return admin credentials in response body
    return NextResponse.json({
      ok: true,
      adminCreated,
      specialtiesCreated,
      templatesCreated,
      message: "تم تجهيز النظام بنجاح",
      stats: {
        specialties: await db.specialty.count(),
        certificateTemplates: await db.certificateTemplate.count(),
      },
    });
  } catch (e) {
    // SECURITY: Don't leak error details to client
    console.error("Seed error:", e);
    return NextResponse.json({ ok: false, error: "فشل في تجهيز النظام" }, { status: 500 });
  }
}

// POST: Same as GET (for manual seeding)
export async function POST() {
  return GET();
}
