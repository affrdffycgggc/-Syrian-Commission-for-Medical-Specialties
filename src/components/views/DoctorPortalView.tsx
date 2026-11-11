"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Loader2,
  Award,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  User,
  IdCard,
  Download,
  FileText,
  GraduationCap,
  Stethoscope,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { formatArabicDate } from "@/lib/helpers";

interface DoctorActivity {
  participantId: string;
  activity: {
    id: string;
    title: string;
    type: string;
    typeName: string;
    governorate?: string | null;
    location: string;
    startDate: string;
    endDate: string;
    hoursCount: number;
    daysCount: number;
    organizerName?: string | null;
    organizerLogo?: string | null;
    specialty?: { id: string; name: string; sliceName: string } | null;
  };
  role: string;
  participationType: string | null;
  paymentStatus: string;
  verifiedCount: number;
  totalSessions: number;
  activityCpd: number;
  earnedCpd: number;
  certTitle: string;
  certCpd: number;
  canGetCertificate: boolean;
  registeredAt: string;
}

interface DoctorResult {
  found: boolean;
  nationalId: string;
  fullName?: string;
  activities: DoctorActivity[];
  totalCpd: number;
  totalActivities: number;
  totalCertificates: number;
  totalVerifiedSessions: number;
}

export function DoctorPortalView() {
  const { showToast } = useAppStore();
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoctorResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId || nationalId.length < 4) {
      showToast("يرجى إدخال الرقم الوطني بشكل صحيح", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/doctor?nationalId=${encodeURIComponent(nationalId.trim())}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "فشل في البحث", "error");
        return;
      }
      setResult(data);
      if (data.found) {
        showToast(`تم العثور على ${data.totalActivities} نشاط`, "success");
      } else {
        showToast("لا توجد سجلات بهذا الرقم الوطني", "info");
      }
    } catch (e) {
      showToast("حدث خطأ. حاول مرة أخرى", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (participantId: string) => {
    try {
      showToast("جاري تحضير الشهادة...", "info");
      const res = await fetch(`/api/certificates?participantId=${participantId}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "لا يمكن إنشاء الشهادة", "error");
        return;
      }
      // Open certificate in new window for printing/saving
      const certWindow = window.open("", "_blank", "width=900,height=1200");
      if (!certWindow) {
        showToast("يرجى السماح بالنوافذ المنبثقة", "error");
        return;
      }
      certWindow.document.write(generateCertificateHTML(data.certificate));
      certWindow.document.close();
      showToast("تم إنشاء الشهادة بنجاح", "success");
    } catch (e) {
      showToast("حدث خطأ أثناء إنشاء الشهادة", "error");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
            <User className="h-6 w-6" />
          </div>
          بوابة الطبيب
        </h1>
        <p className="text-muted-foreground">
          ابحث عن طريق الرقم الوطني لعرض جميع النشاطات التي شاركت بها ونقاط CPD المكتسبة وتحميل الشهادات
        </p>
      </div>

      <Card className="border-2 border-emerald-200 shadow-modern mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <IdCard className="h-4 w-4 text-emerald-600" />
                الرقم الوطني
                <span className="text-rose-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="أدخل الرقم الوطني كما في الهوية"
                  maxLength={12}
                  required
                  className="text-base ltr-text text-left h-12"
                  dir="ltr"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine h-12 px-6"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-5 w-5 ml-2" />
                      بحث
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && result.found && (
        <>
          {/* Doctor summary */}
          <Card className="border-2 border-emerald-300 shadow-modern-lg mb-6 bg-gradient-to-l from-emerald-50 to-teal-50">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{result.fullName}</h2>
                    <p className="text-xs text-muted-foreground font-mono ltr-text" dir="ltr">
                      الرقم الوطني: {result.nationalId}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="px-4 py-2 rounded-xl bg-white border border-emerald-200">
                    <p className="text-xs text-muted-foreground">نشاطات</p>
                    <p className="text-lg font-bold text-emerald-700">{result.totalActivities}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white border border-amber-200">
                    <p className="text-xs text-muted-foreground">نقاط CPD</p>
                    <p className="text-lg font-bold text-amber-600">{result.totalCpd.toFixed(1)}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white border border-blue-200">
                    <p className="text-xs text-muted-foreground">شهادات</p>
                    <p className="text-lg font-bold text-blue-600">{result.totalCertificates}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities list */}
          {result.activities.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                النشاطات والمؤتمرات
              </h3>
              {result.activities.map((a, idx) => (
                <Card key={a.participantId} className={`shadow-modern border-2 ${
                  a.canGetCertificate
                    ? "border-emerald-200"
                    : a.paymentStatus === "approved"
                    ? "border-amber-200"
                    : "border-rose-200"
                }`}>
                  <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-lg flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base leading-tight">{a.activity.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatArabicDate(a.activity.startDate)}
                          </span>
                          {a.activity.governorate && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {a.activity.governorate}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {a.activity.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {a.activity.typeName || a.activity.type}
                          </span>
                          {a.activity.specialty && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                              {a.activity.specialty.sliceName} - {a.activity.specialty.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            a.role === "resident"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-teal-100 text-teal-700"
                          }`}>
                            {a.role === "resident" ? (
                              <>
                                <GraduationCap className="h-3 w-3" />
                                مقيم
                              </>
                            ) : (
                              <>
                                <Stethoscope className="h-3 w-3" />
                                ممارس
                                {a.participationType === "participation" ? " - مشاركة" : " - حضور"}
                              </>
                            )}
                          </span>
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            a.paymentStatus === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : a.paymentStatus === "pending" || a.paymentStatus === "awaiting_approval"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {a.paymentStatus === "approved" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                مدفوع
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                {a.paymentStatus === "awaiting_approval" ? "بانتظار الموافقة" : a.paymentStatus === "pending" ? "بانتظار الدفع" : "مرفوض"}
                              </>
                            )}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {a.verifiedCount}/{a.totalSessions} جلسة
                          </span>
                          {a.role !== "resident" && a.earnedCpd > 0 && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <Award className="h-3 w-3" />
                              {a.earnedCpd.toFixed(1)} نقطة CPD
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {a.canGetCertificate ? (
                          <Button
                            onClick={() => handleDownloadCertificate(a.participantId)}
                            className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine"
                            size="sm"
                          >
                            <Download className="h-4 w-4 ml-2" />
                            تحميل {a.certTitle}
                          </Button>
                        ) : (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {a.paymentStatus !== "approved"
                              ? "غير متاح - الدفع غير مكتمل"
                              : a.verifiedCount < a.totalSessions
                              ? `يلزم إكمال ${a.totalSessions - a.verifiedCount} جلسة`
                              : "غير متاح"}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">لا توجد نشاطات مسجلة</p>
                <p className="text-xs mt-1">سيتم عرض النشاطات هنا بعد التسجيل والحضور</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {result && !result.found && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد سجلات بهذا الرقم الوطني</p>
            <p className="text-xs mt-1">تأكد من إدخال الرقم الوطني بشكل صحيح</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Generate printable HTML certificate
function generateCertificateHTML(cert: any): string {
  const certTitle = cert.certificate.title;
  const subtitle = cert.certificate.subtitle || "";
  const headerText = cert.certificate.headerText;
  const bodyText = cert.certificate.bodyText;
  const footerText = cert.certificate.footerText;
  const signatureText = cert.certificate.signatureText;
  const authorityLogo = cert.certificate.authorityLogo;
  const authorityName = cert.certificate.authorityName;
  const organizerLogo = cert.certificate.organizerLogo;
  const organizerName = cert.certificate.organizerName;
  const supportingLogos: string[] = cert.certificate.supportingLogos || [];
  const showCpd = cert.cpd.showCpd && cert.certificate.showCpdPoints;
  const totalCpd = cert.cpd.totalCpd;
  const borderColor = cert.certificate.borderColor;
  const backgroundColor = cert.certificate.backgroundColor;
  const governorate = cert.activity.governorate || cert.certificate.governorate || "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${certTitle} - ${cert.participantName}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif; background: #f5f5f5; }
  .certificate {
    width: 297mm; height: 210mm;
    background: ${backgroundColor};
    border: 8px solid ${borderColor};
    margin: 20px auto;
    position: relative;
    padding: 30px 50px;
    box-shadow: 0 4px 30px rgba(0,0,0,0.1);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  /* شعار الهيئة كخلفية شفافة في وسط الشهادة */
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 400px; height: 400px;
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
  }
  .watermark img {
    width: 100%; height: 100%;
    object-fit: contain;
  }
  /* كل المحتوى فوق الخلفية */
  .certificate > *:not(.watermark) {
    position: relative;
    z-index: 1;
  }
  .inner-border {
    position: absolute; top: 12px; right: 12px; bottom: 12px; left: 12px;
    border: 2px solid ${borderColor};
    pointer-events: none;
    z-index: 1;
  }
  .logos-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px;
  }
  .logo-side { display: flex; align-items: center; gap: 15px; }
  .logo-img { max-height: 80px; max-width: 120px; object-fit: contain; }
  .logo-text { font-size: 13px; color: #333; font-weight: bold; }
  .header-center { text-align: center; flex: 1; }
  .header-center h1 { font-size: 22px; color: ${borderColor}; margin-bottom: 5px; }
  .header-center p { font-size: 12px; color: #666; }
  .cert-title-section { text-align: center; margin: 25px 0 20px; }
  .cert-title {
    font-size: 48px; font-weight: bold; color: ${borderColor};
    padding: 10px 30px; display: inline-block;
    border-bottom: 3px double ${borderColor};
  }
  .cert-subtitle { font-size: 18px; color: #666; margin-top: 10px; }
  .participant-name {
    text-align: center;
    font-size: 36px; font-weight: bold; color: #1a1a1a;
    margin: 20px auto; padding: 10px 30px;
    border-top: 1px solid ${borderColor};
    border-bottom: 1px solid ${borderColor};
    display: block; width: fit-content;
  }
  .body-text {
    font-size: 18px; line-height: 2; color: #333;
    text-align: center; max-width: 80%; margin: 20px auto;
  }
  .activity-info {
    text-align: center; margin: 20px 0;
    font-size: 16px; color: #444;
    line-height: 1.8;
  }
  .activity-info p { margin-bottom: 5px; }
  .activity-info strong { color: ${borderColor}; }
  /* CPD section at the BOTTOM */
  .cpd-section {
    text-align: center; margin: 25px auto;
    padding: 15px;
    background: rgba(16, 185, 129, 0.08);
    border: 1.5px solid ${borderColor};
    border-radius: 8px;
    width: 50%;
  }
  .cpd-section .label { font-size: 14px; color: #555; }
  .cpd-section .value { font-size: 28px; font-weight: bold; color: ${borderColor}; }
  .footer {
    margin-top: auto;
    padding-top: 20px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .signature { text-align: center; }
  .signature-line { width: 200px; border-top: 2px solid #333; margin-bottom: 8px; }
  .signature-text { font-size: 14px; font-weight: bold; color: #333; }
  .signature-sub { font-size: 11px; color: #666; }
  .supporting-logos {
    display: flex; gap: 20px; align-items: center; justify-content: center;
    margin-top: 15px;
  }
  .supporting-logos img {
    max-height: 50px; max-width: 100px; object-fit: contain; opacity: 0.9;
  }
  .footer-text {
    text-align: center; font-size: 11px; color: #888;
    margin-top: 15px;
  }
  @media print {
    body { background: white; }
    .certificate { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="certificate">
  <div class="inner-border"></div>

  <!-- شعار الهيئة السورية كخلفية شفافة -->
  <div class="watermark">
    <img src="/logo-original.jpg" alt="شعار الهيئة السورية للاختصاصات الطبية" />
  </div>

  <div class="logos-top">
    <div class="logo-side">
      ${authorityLogo ? `<img src="${authorityLogo}" class="logo-img" alt="شعار الهيئة">` : ''}
      <div class="logo-text">${authorityName || ""}</div>
    </div>
    <div class="header-center">
      <h1>${headerText}</h1>
    </div>
    <div class="logo-side">
      ${organizerLogo ? `<img src="${organizerLogo}" class="logo-img" alt="شعار المنظم">` : ''}
      <div class="logo-text">${organizerName || cert.activity.organizerName || ""}</div>
    </div>
  </div>

  <div class="cert-title-section">
    <div class="cert-title">${certTitle}</div>
    ${subtitle ? `<div class="cert-subtitle">${subtitle}</div>` : ''}
  </div>

  <div class="participant-name">${cert.participantName}</div>

  <div class="body-text">${bodyText}</div>

  <div class="activity-info">
    <p>نوع النشاط: <strong>${cert.activity.typeName || cert.activity.type}</strong></p>
    <p>اسم النشاط: <strong>${cert.activity.title}</strong></p>
    <p>اسم المشارك: <strong>${cert.participantName}</strong></p>
    <p>الرقم الوطني: <strong>${cert.nationalId}</strong></p>
    ${governorate ? `<p>المحافظة: <strong>${governorate}</strong></p>` : ''}
    <p>المكان: <strong>${cert.activity.location}</strong></p>
    <p>التاريخ: <strong>من ${new Date(cert.activity.startDate).toLocaleDateString("ar-EG")} إلى ${new Date(cert.activity.endDate).toLocaleDateString("ar-EG")}</strong></p>
    <p>الفترة الزمنية: <strong>${cert.activity.timePeriod || ""}</strong></p>
    <p>عدد الأيام: <strong>${cert.activity.daysCount || 1} يوم</strong></p>
    <p>عدد الساعات: <strong>${cert.activity.hoursCount} ساعة</strong></p>
  </div>

  ${supportingLogos.length > 0 ? `
  <div class="supporting-logos">
    ${supportingLogos.map((url: string) => `<img src="${url}" alt="شعار">`).join("")}
  </div>
  ` : ''}

  ${showCpd ? `
  <div class="cpd-section">
    <div class="label">نقاط CPD الممنوحة</div>
    <div class="value">${totalCpd.toFixed(1)} نقطة</div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-text">${signatureText || "توقيع"}</div>
      <div class="signature-sub">${authorityName || "الهيئة السورية للاختصاصات الطبية"}</div>
    </div>
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-text">رقم المرجع</div>
      <div class="signature-sub">${cert.participantId.slice(-8).toUpperCase()}</div>
    </div>
  </div>

  <div class="footer-text">${footerText || ""} | تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}</div>
</div>
<script>
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;
}
