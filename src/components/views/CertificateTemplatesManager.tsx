"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Upload,
  ImageIcon,
  Save,
  Eye,
  Trash2,
  Plus,
  FileText,
  Award,
  X,
} from "lucide-react";

interface CertificateTemplate {
  id: string;
  name: string;
  roleType: string;
  participationType: string | null;
  certTitle: string;
  certSubtitle?: string | null;
  authorityLogo?: string | null;
  authorityName?: string | null;
  organizerLogo?: string | null;
  organizerName?: string | null;
  supportingLogos?: string | null;
  headerText?: string | null;
  bodyText: string;
  footerText?: string | null;
  signatureText?: string | null;
  signatureImage?: string | null;
  showCpdPoints: boolean;
  backgroundColor: string;
  borderColor: string;
  isActive: boolean;
}

const DEFAULT_TEMPLATES = [
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
  },
];

const PLACEHOLDERS = [
  "{participantName} - اسم المشارك",
  "{nationalId} - الرقم الوطني",
  "{activityType} - نوع النشاط",
  "{activityName} - اسم النشاط",
  "{governorate} - محافظة النشاط",
  "{location} - مكان النشاط",
  "{dateFrom} - تاريخ البداية",
  "{dateTo} - تاريخ النهاية",
  "{timePeriod} - الفترة الزمنية",
  "{timeFrom} - وقت البداية",
  "{timeTo} - وقت النهاية",
  "{daysCount} - عدد الأيام",
  "{hoursCount} - عدد الساعات",
  "{cpdPoints} - نقاط CPD (تظهر في أسفل الشهادة)",
  "{participationVerb} - فعل المشاركة (شارك/حضر)",
  "{specialty} - الاختصاص",
  "{organizerName} - اسم الجهة المنظمة",
];

export function CertificateTemplatesManager() {
  const { showToast } = useAppStore();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/certificate-templates");
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setTemplates(data.templates || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSeedDefaults = async () => {
    if (!confirm("سيتم إنشاء النماذج الافتراضية الثلاثة (مقيم، ممارس-مشاركة، ممارس-حضور) إذا لم تكن موجودة. متابعة؟")) return;
    try {
      const res = await fetch("/api/certificate-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: DEFAULT_TEMPLATES }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        showToast(`تم إنشاء ${data.created} نموذج جديد وتحديث ${data.updated} نموذج`, "success");
        loadTemplates();
      } else {
        showToast(data.error || "فشل في الإنشاء", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleSave = async (template: CertificateTemplate) => {
    try {
      if (template.id) {
        // Update
        const res = await fetch(`/api/certificate-templates/${template.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });
        if (res.ok) {
          showToast("تم تحديث النموذج", "success");
          setEditing(null);
          loadTemplates();
        }
      } else {
        // Create
        const res = await fetch("/api/certificate-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });
        if (res.ok) {
          showToast("تم إنشاء النموذج", "success");
          setCreating(false);
          setEditing(null);
          loadTemplates();
        }
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا النموذج؟")) return;
    try {
      const res = await fetch(`/api/certificate-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("تم حذف النموذج", "success");
        loadTemplates();
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleUploadLogo = async (file: File, type: "authority" | "organizer" | "supporting" | "signature"): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await fetch("/api/certificates", {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        return data.url;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-emerald-600" />
            نماذج الشهادات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            تصميم وتكوين نماذج الشهادات: اللوغويات، النصوص، الحقول المتغيرة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults}>
            <Plus className="h-4 w-4 ml-2" />
            إنشاء النماذج الافتراضية
          </Button>
          <Button
            onClick={() => {
              setEditing({
                id: "",
                name: "",
                roleType: "practitioner",
                participationType: "attendance",
                certTitle: "شهادة حضور",
                certSubtitle: "",
                authorityLogo: "/logo-original.jpg",
                authorityName: "الهيئة السورية للاختصاصات الطبية",
                organizerLogo: "",
                organizerName: "",
                supportingLogos: "[]",
                headerText: "الهيئة السورية للاختصاصات الطبية",
                bodyText: "تشهد الهيئة السورية للاختصاصات الطبية بأن {participantName} قد حضر في {activityType} التالي:",
                footerText: "صادرة عن الهيئة السورية للاختصاصات الطبية",
                signatureText: "رئيس الهيئة",
                signatureImage: "",
                showCpdPoints: true,
                backgroundColor: "#ffffff",
                borderColor: "#10b981",
                isActive: true,
              } as any);
              setCreating(true);
            }}
            className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة نموذج
          </Button>
        </div>
      </div>

      {/* Placeholders info */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-5">
          <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الحقول المتغيرة المتاحة في نص الشهادة:
          </p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((p) => (
              <Badge key={p} variant="outline" className="bg-white border-blue-200 text-blue-700 font-mono">
                {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground border-2 border-dashed">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد نماذج شهادات بعد</p>
            <p className="text-xs mt-1 mb-4">يمكنك إنشاء النماذج الافتراضية أو إضافة نموذج جديد</p>
            <Button onClick={handleSeedDefaults} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white">
              <Plus className="h-4 w-4 ml-2" />
              إنشاء النماذج الافتراضية
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className={`border-2 shadow-modern ${t.isActive ? "border-emerald-200" : "border-muted"}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      t.roleType === "resident"
                        ? "bg-purple-100 text-purple-700"
                        : t.participationType === "participation"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.roleType === "resident" ? "مقيم" : t.participationType === "participation" ? "ممارس - مشاركة" : "ممارس - حضور"}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium mb-2">{t.certTitle}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.bodyText}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setCreating(false); }} className="text-emerald-700 hover:bg-emerald-50 h-8">
                    <FileText className="h-3.5 w-3.5 ml-1" />
                    تعديل
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-rose-700 hover:bg-rose-50 h-8">
                    <Trash2 className="h-3.5 w-3.5 ml-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      {editing && (
        <CertificateTemplateEditor
          template={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
          onUpload={handleUploadLogo}
        />
      )}
    </div>
  );
}

function CertificateTemplateEditor({
  template,
  onClose,
  onSave,
  onUpload,
}: {
  template: CertificateTemplate;
  onClose: () => void;
  onSave: (t: CertificateTemplate) => void;
  onUpload: (file: File, type: "authority" | "organizer" | "supporting" | "signature") => Promise<string | null>;
}) {
  const [form, setForm] = useState<CertificateTemplate>(template);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "authority" | "organizer" | "supporting" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const url = await onUpload(file, type);
      if (url) {
        if (type === "supporting") {
          const current = form.supportingLogos ? JSON.parse(form.supportingLogos) : [];
          current.push(url);
          updateForm("supportingLogos", JSON.stringify(current));
        } else {
          updateForm(type + "Logo", url);
        }
        // success
      }
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const removeSupportingLogo = (url: string) => {
    const current = form.supportingLogos ? JSON.parse(form.supportingLogos) : [];
    const updated = current.filter((u: string) => u !== url);
    updateForm("supportingLogos", JSON.stringify(updated));
  };

  const handleSave = async () => {
    if (!form.name || !form.roleType || !form.certTitle || !form.bodyText) {
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const supportingLogosArray: string[] = (() => {
    try { return form.supportingLogos ? JSON.parse(form.supportingLogos) : []; } catch { return []; }
  })();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeInScale">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              {template.id ? "تعديل نموذج الشهادة" : "إضافة نموذج شهادة جديد"}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 ml-1" />
                {showPreview ? "إخفاء المعاينة" : "معاينة"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base border-b pb-2">البيانات الأساسية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">اسم النموذج *</Label>
                <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="مثال: نموذج الممارس - مشاركة" />
              </div>
              <div>
                <Label className="text-sm font-medium">عنوان الشهادة *</Label>
                <Input value={form.certTitle} onChange={(e) => updateForm("certTitle", e.target.value)} placeholder="مثال: شهادة مشاركة" />
              </div>
              <div>
                <Label className="text-sm font-medium">نوع الطبيب *</Label>
                <Select value={form.roleType} onValueChange={(v) => updateForm("roleType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">مقيم</SelectItem>
                    <SelectItem value="practitioner">ممارس</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.roleType === "practitioner" && (
                <div>
                  <Label className="text-sm font-medium">نوع المشاركة</Label>
                  <Select value={form.participationType || "attendance"} onValueChange={(v) => updateForm("participationType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participation">مشاركة</SelectItem>
                      <SelectItem value="attendance">حضور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">العنوان الفرعي</Label>
                <Input value={form.certSubtitle || ""} onChange={(e) => updateForm("certSubtitle", e.target.value)} placeholder="مثال: تصديقاً للمشاركة" />
              </div>
              <div>
                <Label className="text-sm font-medium">النص العلوي</Label>
                <Input value={form.headerText || ""} onChange={(e) => updateForm("headerText", e.target.value)} placeholder="مثال: الهيئة السورية للاختصاصات الطبية" />
              </div>
            </div>
          </div>

          {/* Logos */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base border-b pb-2">اللوغويات</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">شعار الهيئة</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.authorityLogo && (
                    <img src={form.authorityLogo} alt="شعار الهيئة" className="h-16 w-16 object-contain rounded-lg border" />
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "authority")} className="hidden" id="upload-authority" />
                    <Button variant="outline" size="sm" asChild disabled={uploading === "authority"}>
                      <label htmlFor="upload-authority" className="cursor-pointer">
                        {uploading === "authority" ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Upload className="h-4 w-4 ml-1" />}
                        رفع
                      </label>
                    </Button>
                    {form.authorityLogo && (
                      <Button variant="ghost" size="sm" onClick={() => updateForm("authorityLogo", "")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input value={form.authorityName || ""} onChange={(e) => updateForm("authorityName", e.target.value)} placeholder="اسم الهيئة" className="mt-2" />
              </div>
              <div>
                <Label className="text-sm font-medium">شعار الجهة المنظمة</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.organizerLogo && (
                    <img src={form.organizerLogo} alt="شعار المنظم" className="h-16 w-16 object-contain rounded-lg border" />
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "organizer")} className="hidden" id="upload-organizer" />
                    <Button variant="outline" size="sm" asChild disabled={uploading === "organizer"}>
                      <label htmlFor="upload-organizer" className="cursor-pointer">
                        {uploading === "organizer" ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Upload className="h-4 w-4 ml-1" />}
                        رفع
                      </label>
                    </Button>
                    {form.organizerLogo && (
                      <Button variant="ghost" size="sm" onClick={() => updateForm("organizerLogo", "")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input value={form.organizerName || ""} onChange={(e) => updateForm("organizerName", e.target.value)} placeholder="اسم الجهة المنظمة" className="mt-2" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">شعارات الجهات الراعية (إضافية)</Label>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {supportingLogosArray.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={url} alt={`شعار ${idx + 1}`} className="h-16 w-16 object-contain rounded-lg border" />
                    <button
                      onClick={() => removeSupportingLogo(url)}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "supporting")} className="hidden" id="upload-supporting" />
                <Button variant="outline" size="sm" asChild disabled={uploading === "supporting"}>
                  <label htmlFor="upload-supporting" className="cursor-pointer">
                    {uploading === "supporting" ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Plus className="h-4 w-4 ml-1" />}
                    إضافة شعار
                  </label>
                </Button>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base border-b pb-2">النصوص</h4>
            <div>
              <Label className="text-sm font-medium">نص الشهادة (مع الحقول المتغيرة) *</Label>
              <Textarea
                value={form.bodyText}
                onChange={(e) => updateForm("bodyText", e.target.value)}
                placeholder="مثال: تشهد الهيئة بأن {participantName} قد حضر في {activityType} بعنوان {activityName} المنعقد في {location} خلال الفترة من {dateFrom} إلى {dateTo}"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                استخدم الحقول بين أقواس معقوفة: {"{participantName}, {activityType}, {activityName}, {location}, {dateFrom}, {dateTo}, {cpdPoints}, {hoursCount}, {participationVerb}, {specialty}, {organizerName}"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">النص السفلي</Label>
              <Input value={form.footerText || ""} onChange={(e) => updateForm("footerText", e.target.value)} placeholder="مثال: صادرة عن الهيئة السورية للاختصاصات الطبية" />
            </div>
            <div>
              <Label className="text-sm font-medium">نص التوقيع</Label>
              <Input value={form.signatureText || ""} onChange={(e) => updateForm("signatureText", e.target.value)} placeholder="مثال: رئيس الهيئة" />
            </div>
          </div>

          {/* Display options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base border-b pb-2">خيارات العرض</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                <Switch checked={form.showCpdPoints} onCheckedChange={(v) => updateForm("showCpdPoints", v)} />
                <div>
                  <p className="text-sm font-medium">عرض نقاط CPD في الشهادة</p>
                  <p className="text-xs text-muted-foreground">يُفترض عدم تفعيله لنموذج المقيم</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">لون الإطار</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="color" value={form.borderColor} onChange={(e) => updateForm("borderColor", e.target.value)} className="w-12 h-10 p-1" />
                  <Input value={form.borderColor} onChange={(e) => updateForm("borderColor", e.target.value)} className="ltr-text" dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">لون الخلفية</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="color" value={form.backgroundColor} onChange={(e) => updateForm("backgroundColor", e.target.value)} className="w-12 h-10 p-1" />
                  <Input value={form.backgroundColor} onChange={(e) => updateForm("backgroundColor", e.target.value)} className="ltr-text" dir="ltr" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                <Switch checked={form.isActive} onCheckedChange={(v) => updateForm("isActive", v)} />
                <div>
                  <p className="text-sm font-medium">النموذج مفعّل</p>
                  <p className="text-xs text-muted-foreground">يُستخدم في إصدار الشهادات</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-3">
              <h4 className="font-semibold text-base border-b pb-2">معاينة</h4>
              <CertificatePreview template={form} />
            </div>
          )}
        </div>

        <div className="p-6 border-t sticky bottom-0 bg-white flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine">
            {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ النموذج
          </Button>
        </div>
      </div>
    </div>
  );
}

function CertificatePreview({ template }: { template: CertificateTemplate }) {
  const sampleText = (template.bodyText || "")
    .replace(/\{participantName\}/g, "د. محمد أحمد الخطيب")
    .replace(/\{nationalId\}/g, "12345678901")
    .replace(/\{activityType\}/g, "مؤتمر")
    .replace(/\{activityName\}/g, "المؤتمر الطبي السنوي 2026")
    .replace(/\{governorate\}/g, "دمشق")
    .replace(/\{location\}/g, "دمشق - قصر المؤتمرات")
    .replace(/\{dateFrom\}/g, "١ يناير ٢٠٢٦")
    .replace(/\{dateTo\}/g, "٣ يناير ٢٠٢٦")
    .replace(/\{timePeriod\}/g, "9 صباحاً - 5 مساءً")
    .replace(/\{timeFrom\}/g, "9:00 ص")
    .replace(/\{timeTo\}/g, "5:00 م")
    .replace(/\{daysCount\}/g, "3")
    .replace(/\{cpdPoints\}/g, "8.0")
    .replace(/\{hoursCount\}/g, "24")
    .replace(/\{participationVerb\}/g, template.participationType === "participation" ? "شارك" : "حضر")
    .replace(/\{specialty\}/g, "طب بشري - أمراض قلبية")
    .replace(/\{organizerName\}/g, "الهيئة السورية للاختصاصات الطبية");

  const supportingLogosArray: string[] = (() => {
    try { return template.supportingLogos ? JSON.parse(template.supportingLogos) : []; } catch { return []; }
  })();

  return (
    <div
      className="relative p-6 mx-auto"
      style={{
        background: template.backgroundColor,
        border: `6px solid ${template.borderColor}`,
        width: "100%",
        maxWidth: "800px",
        minHeight: "400px",
      }}
    >
      <div style={{ position: "absolute", top: "8px", right: "8px", bottom: "8px", left: "8px", border: `2px solid ${template.borderColor}`, pointerEvents: "none" }} />

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {template.authorityLogo && <img src={template.authorityLogo} alt="شعار" style={{ maxHeight: "60px", maxWidth: "80px", objectFit: "contain" }} />}
          <span className="text-xs font-bold">{template.authorityName}</span>
        </div>
        <div className="text-center flex-1 px-4">
          <div className="font-bold text-base" style={{ color: template.borderColor }}>{template.headerText}</div>
        </div>
        <div className="flex items-center gap-2">
          {template.organizerLogo && <img src={template.organizerLogo} alt="منظم" style={{ maxHeight: "60px", maxWidth: "80px", objectFit: "contain" }} />}
          <span className="text-xs font-bold">{template.organizerName || "الجهة المنظمة"}</span>
        </div>
      </div>

      <div className="text-center my-6">
        <div style={{ fontSize: "32px", fontWeight: "bold", color: template.borderColor, borderBottom: `3px double ${template.borderColor}`, display: "inline-block", padding: "5px 20px" }}>
          {template.certTitle}
        </div>
        {template.certSubtitle && <div className="text-sm text-muted-foreground mt-2">{template.certSubtitle}</div>}
      </div>

      <div className="text-center my-4">
        <div style={{ fontSize: "22px", fontWeight: "bold", borderTop: `1px solid ${template.borderColor}`, borderBottom: `1px solid ${template.borderColor}`, display: "inline-block", padding: "8px 24px" }}>
          د. محمد أحمد الخطيب
        </div>
      </div>

      <div className="text-center my-4 text-sm leading-loose px-8">{sampleText}</div>

      <div className="text-center my-3 text-sm">
        <p>نوع النشاط: <strong>مؤتمر</strong></p>
        <p>اسم النشاط: <strong>المؤتمر الطبي السنوي 2026</strong></p>
        <p>اسم المشارك: <strong>د. محمد أحمد الخطيب</strong></p>
        <p>الرقم الوطني: <strong>12345678901</strong></p>
        <p>محافظة النشاط: <strong>دمشق</strong></p>
        <p>المكان: <strong>دمشق - قصر المؤتمرات</strong></p>
        <p>التاريخ: <strong>من ١ يناير ٢٠٢٦ إلى ٣ يناير ٢٠٢٦</strong></p>
        <p>الفترة الزمنية: <strong>9 صباحاً - 5 مساءً</strong></p>
        <p>عدد الأيام: <strong>3 يوم</strong></p>
      </div>

      {/* CPD section at the BOTTOM of the certificate */}
      {template.showCpdPoints && (
        <div className="text-center mt-8 p-3 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.08)", border: `1.5px solid ${template.borderColor}` }}>
          <div className="text-xs">نقاط CPD الممنوحة</div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: template.borderColor }}>8.0 نقطة</div>
        </div>
      )}

      {supportingLogosArray.length > 0 && (
        <div className="flex justify-center gap-3 my-3">
          {supportingLogosArray.map((url, idx) => (
            <img key={idx} src={url} alt="شعار" style={{ maxHeight: "40px", objectFit: "contain" }} />
          ))}
        </div>
      )}

      {/* Signatures at the bottom */}
      <div className="flex justify-between mt-8 px-4">
        <div className="text-center">
          <div style={{ width: "150px", borderTop: "2px solid #333", marginBottom: "5px" }} />
          <div className="text-sm font-bold">{template.signatureText || "توقيع"}</div>
          <div className="text-xs text-muted-foreground">{template.authorityName}</div>
        </div>
        <div className="text-center">
          <div style={{ width: "150px", borderTop: "2px solid #333", marginBottom: "5px" }} />
          <div className="text-sm font-bold">رقم المرجع</div>
          <div className="text-xs text-muted-foreground font-mono">CERT-2026</div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground mt-3">
        {template.footerText}
      </div>
    </div>
  );
}
