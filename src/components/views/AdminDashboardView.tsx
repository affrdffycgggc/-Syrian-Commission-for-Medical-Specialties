"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  MapPin,
  Award,
  Users,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  Activity as ActivityIcon,
  Clock,
  X,
  CalendarDays,
  Timer,
  CheckCircle2,
  Eye,
  Star,
  User,
  Settings,
  Sparkles,
  Navigation,
  Wallet,
  Receipt,
  CreditCard,
  Stethoscope,
  Upload,
} from "lucide-react";
import type { Activity, Session, Specialty } from "@/lib/types";
import { formatArabicDate, formatArabicDateTime, formatTime } from "@/lib/helpers";
import { MapPicker } from "@/components/MapPicker";
import { PaymentMethodsManager } from "@/components/views/PaymentMethodsManager";
import { PaymentRequestsManager } from "@/components/views/PaymentRequestsManager";
import { ParticipantsManager } from "@/components/views/ParticipantsManager";
import { SpecialtiesManager } from "@/components/views/SpecialtiesManager";
import { CertificateTemplatesManager } from "@/components/views/CertificateTemplatesManager";

const ACTIVITY_TYPES = [
  { value: "conference", label: "مؤتمر", color: "emerald" },
  { value: "scientific_day", label: "يوم علمي", color: "teal" },
  { value: "discussion_session", label: "جلسة حوارية", color: "cyan" },
  { value: "workshop", label: "ورشة عمل", color: "amber" },
  { value: "seminar", label: "ندوة", color: "rose" },
  { value: "fellowship", label: "زمالة", color: "blue" },
];

const COLOR_OPTIONS = ["emerald", "teal", "cyan", "amber", "rose"];

const SYRIAN_GOVERNORATES = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "إدلب",
  "دير الزور",
  "الحسكة",
  "الرقة",
  "درعا",
  "السويداء",
  "القنيطرة",
];

export function AdminDashboardView() {
  const { showToast } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [managingSessions, setManagingSessions] = useState<Activity | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<Activity | null>(null);
  const [mainTab, setMainTab] = useState<"activities" | "payment-methods" | "payment-requests" | "participants" | "specialties" | "certificates">("activities");
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingPayment, setTogglingPayment] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const loadPaymentEnabled = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const text = await res.text(); const data = text ? JSON.parse(text) : {};
        setPaymentEnabled(data.paymentEnabled !== false);
        setMaintenanceMode(data.maintenanceMode === true);
      }
    } catch (e) {}
  };

  const togglePaymentEnabled = async () => {
    setTogglingPayment(true);
    try {
      const newValue = !paymentEnabled;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentEnabled: newValue }),
      });
      if (res.ok) {
        setPaymentEnabled(newValue);
        showToast(newValue ? "تم تفعيل نظام الدفع" : "تم إلغاء تفعيل الدفع", "success");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setTogglingPayment(false);
    }
  };

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const newValue = !maintenanceMode;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: newValue }),
      });
      if (res.ok) {
        setMaintenanceMode(newValue);
        showToast(newValue ? "تم تفعيل وضع الصيانة - الموقع مغلق" : "تم إيقاف الصيانة - الموقع متاح", "success");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const res = await fetch("/api/payment-requests?status=pending");
      if (res.ok) {
        const text = await res.text(); const data = text ? JSON.parse(text) : {};
        setPendingRequestsCount(data.stats?.pending || 0);
      }
    } catch (e) {}
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      setActivities(data.activities || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    loadPendingCount();
    loadPaymentEnabled();
    const interval = setInterval(loadPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    window.location.href = "/activities-system";
  };

  const stats = {
    total: activities.length,
    active: activities.filter((a) => a.status === "active").length,
    totalParticipants: activities.reduce((sum, a) => sum + (a._count?.participants || 0), 0),
    totalCpd: activities.reduce((sum, a) => sum + a.cpdPoints, 0),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              لوحة التحكم
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              إدارة النشاطات والمؤتمرات والجلسات ونقاط CPD
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {mainTab === "activities" && (
            <Button onClick={() => { setEditingActivity(null); setShowActivityForm(true); }} className="bg-gradient-to-l from-emerald-600 to-teal-600 hover:opacity-90 text-white btn-shine">
              <Plus className="h-4 w-4 ml-2" />
              إضافة نشاط
            </Button>
          )}
          {/* Payment Enable/Disable Toggle Button */}
          <Button
            onClick={togglePaymentEnabled}
            disabled={togglingPayment}
            className={`btn-shine ${
              paymentEnabled
                ? "bg-gradient-to-l from-amber-500 to-orange-500 hover:opacity-90 text-white"
                : "bg-gradient-to-l from-emerald-600 to-teal-600 hover:opacity-90 text-white"
            }`}
            title={paymentEnabled ? "إلغاء تفعيل الدفع" : "تفعيل الدفع"}
          >
            {togglingPayment ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : paymentEnabled ? (
              <CreditCard className="h-4 w-4 ml-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 ml-2" />
            )}
            {paymentEnabled ? "إلغاء تفعيل الدفع" : "تفعيل الدفع"}
          </Button>
          {/* Maintenance Mode Toggle Button */}
          <Button
            onClick={toggleMaintenance}
            disabled={togglingMaintenance}
            className={`btn-shine ${
              maintenanceMode
                ? "bg-gradient-to-l from-rose-600 to-red-600 hover:opacity-90 text-white"
                : "bg-gradient-to-l from-gray-600 to-gray-700 hover:opacity-90 text-white"
            }`}
            title={maintenanceMode ? "إيقاف الصيانة" : "وضع الموقع في الصيانة"}
          >
            {togglingMaintenance ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 ml-2" />
            )}
            {maintenanceMode ? "إيقاف الصيانة" : "وضع الصيانة"}
          </Button>
          <Button variant="outline" onClick={handleLogout} className="rounded-xl">
            <X className="h-4 w-4 ml-2" />
            خروج
          </Button>
        </div>
      </div>

      {/* Main Tabs - Activities / Payment Methods / Payment Requests */}
      <div className="mb-6 flex gap-2 border-b border-border/40 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setMainTab("activities")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 -mb-px ${
            mainTab === "activities"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-muted/40"
          }`}
        >
          <ActivityIcon className="h-4 w-4" />
          النشاطات
        </button>
        <button
          onClick={() => setMainTab("payment-methods")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 -mb-px ${
            mainTab === "payment-methods"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-muted/40"
          }`}
        >
          <Wallet className="h-4 w-4" />
          طرق الدفع
        </button>
        <button
          onClick={() => setMainTab("payment-requests")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 -mb-px ${
            mainTab === "payment-requests"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-muted/40"
          }`}
        >
          <Receipt className="h-4 w-4" />
          طلبات الدفع
          {pendingRequestsCount > 0 && (
            <span className="flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5">
              {pendingRequestsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab("participants")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 -mb-px ${
            mainTab === "participants"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-muted/40"
          }`}
        >
          <Users className="h-4 w-4" />
          المسجلون
        </button>
        <button
          onClick={() => setMainTab("specialties")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 -mb-px ${
            mainTab === "specialties"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-muted/40"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          الاختصاصات
        </button>
        <button
          onClick={() => setMainTab("certificates")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition-all border-b-2 -mb-px ${
            mainTab === "certificates"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-muted/40"
          }`}
        >
          <Award className="h-4 w-4" />
          نماذج الشهادات
        </button>
      </div>

      {/* Tab Content */}
      {mainTab === "payment-methods" && (
        <>
          {/* Payment status banner */}
          <div className={`mb-4 p-4 rounded-xl border-2 flex items-center justify-between gap-3 ${
            paymentEnabled
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-amber-300 bg-amber-50/50"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                paymentEnabled ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
              }`}>
                {paymentEnabled ? <CheckCircle2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {paymentEnabled ? "نظام الدفع مفعّل" : "نظام الدفع معطّل"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paymentEnabled
                    ? "سيُطلب من المستخدمين دفع الرسوم عند التسجيل"
                    : "سيتم تسجيل المستخدمين مباشرة بدون دفع ويمكنهم المضي للحضور"}
                </p>
              </div>
            </div>
            <Button
              onClick={togglePaymentEnabled}
              disabled={togglingPayment}
              size="sm"
              className={paymentEnabled
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {togglingPayment ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : paymentEnabled ? (
                <X className="h-4 w-4 ml-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 ml-2" />
              )}
              {paymentEnabled ? "إلغاء التفعيل" : "تفعيل الدفع"}
            </Button>
          </div>
          <PaymentMethodsManager />
        </>
      )}
      {mainTab === "payment-requests" && <PaymentRequestsManager />}
      {mainTab === "participants" && <ParticipantsManager />}
      {mainTab === "specialties" && <SpecialtiesManager />}
      {mainTab === "certificates" && <CertificateTemplatesManager />}

      {mainTab === "activities" && (
        <>
          {/* Stats overview - modern */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icon={ActivityIcon} label="إجمالي النشاطات" value={stats.total} color="emerald" />
            <StatCard icon={CheckCircle2} label="نشاطات نشطة" value={stats.active} color="teal" />
            <StatCard icon={Users} label="إجمالي المسجلين" value={stats.totalParticipants} color="cyan" />
            <StatCard icon={Award} label="إجمالي نقاط CPD" value={stats.totalCpd} color="amber" />
          </div>

          {/* Activities table */}
          <Card className="shadow-modern">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ActivityIcon className="h-4 w-4" />
            </div>
            النشاطات والمؤتمرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد نشاطات. أضف نشاطاً جديداً للبدء</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النشاط</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المكان</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الجلسات</TableHead>
                    <TableHead>CPD</TableHead>
                    <TableHead>السعة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id} className="hover:bg-emerald-50/30">
                      <TableCell className="font-medium max-w-xs">
                        <div className="flex items-center gap-2">
                          {a.featured && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </div>
                          )}
                          <p className="line-clamp-2">{a.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                          {a.typeName || a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                        {a.location}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatArabicDate(a.startDate)}
                      </TableCell>
                      <TableCell className="text-sm">{a.sessionsCount}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">{a.cpdPoints}</TableCell>
                      <TableCell className="text-sm">
                        <span className={a._count?.participants || 0 >= a.capacity ? "text-rose-600 font-bold" : ""}>
                          {a._count?.participants || 0}
                        </span>
                        <span className="text-muted-foreground">/{a.capacity}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === "active" ? "default" : "secondary"} className={a.status === "active" ? "bg-emerald-600" : ""}>
                          {a.status === "active" ? "نشط" : a.status === "completed" ? "منتهي" : a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingParticipants(a)}
                            title="عرض المسجلين"
                            className="h-8 w-8 rounded-lg hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagingSessions(a)}
                            title="إدارة الجلسات"
                            className="h-8 w-8 rounded-lg hover:bg-emerald-50"
                          >
                            <CalendarDays className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingActivity(a); setShowActivityForm(true); }}
                            title="تعديل"
                            className="h-8 w-8 rounded-lg hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(a)}
                            title="حذف"
                            className="h-8 w-8 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {/* Activity form dialog */}
      {showActivityForm && (
        <ActivityFormDialog
          activity={editingActivity}
          onClose={() => { setShowActivityForm(false); setEditingActivity(null); }}
          onSaved={() => {
            setShowActivityForm(false);
            setEditingActivity(null);
            loadActivities();
            // الانتقال تلقائياً لتبويب نماذج الشهادات بعد إضافة نشاط جديد
            if (!editingActivity) {
              showToast("تم إنشاء النشاط بنجاح. انتقل الآن لإعداد نموذج الشهادة", "success");
              setTimeout(() => setMainTab("certificates"), 1000);
            }
          }}
        />
      )}

      {/* Sessions management dialog */}
      {managingSessions && (
        <SessionsManagementDialog
          activity={managingSessions}
          onClose={() => setManagingSessions(null)}
          onSaved={() => loadActivities()}
        />
      )}

      {/* Participants dialog */}
      {viewingParticipants && (
        <ParticipantsDialog
          activity={viewingParticipants}
          onClose={() => setViewingParticipants(null)}
        />
      )}
    </div>
  );

  async function handleDelete(activity: Activity) {
    if (!confirm(`هل أنت متأكد من حذف النشاط: ${activity.title}؟`)) return;
    try {
      const res = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("تم حذف النشاط بنجاح", "success");
        loadActivities();
      } else {
        showToast("فشل في الحذف", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  }
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    teal: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
    cyan: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
    amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  };
  const c = colors[color] || colors.emerald;
  return (
    <Card className={`border-2 ${c.border} shadow-modern`}>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Form Dialog - with Map Picker
function ActivityFormDialog({
  activity,
  onClose,
  onSaved,
}: {
  activity: Activity | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [sessionSlots, setSessionSlots] = useState<Array<{
    title: string;
    day: string;
    startTime: string;
    endTime: string;
    cpdPoints: string;
  }>>([]);
  const [form, setForm] = useState({
    title: activity?.title || "",
    description: activity?.description || "",
    type: activity?.type || "conference",
    typeName: activity?.typeName || "مؤتمر",
    location: activity?.location || "",
    governorate: (activity as any)?.governorate || "",
    latitude: activity?.latitude?.toString() || "33.5138",
    longitude: activity?.longitude?.toString() || "36.2765",
    radius: activity?.radius?.toString() || "100",
    startDate: activity?.startDate ? new Date(activity.startDate).toISOString().slice(0, 16) : "",
    endDate: activity?.endDate ? new Date(activity.endDate).toISOString().slice(0, 16) : "",
    daysCount: activity?.daysCount?.toString() || "1",
    sessionsCount: activity?.sessionsCount?.toString() || "1",
    timePeriod: activity?.timePeriod || "9 صباحاً - 5 مساءً",
    hoursCount: activity?.hoursCount?.toString() || "8",
    cpdPoints: activity?.cpdPoints?.toString() || "8",
    cpdPointsParticipation: activity?.cpdPointsParticipation?.toString() || "12",
    requiredCpdForCertificate: (activity as any)?.requiredCpdForCertificate?.toString() || "0",
    certRequirementType: (activity as any)?.requiredCpdForCertificate && (activity as any)?.requiredCpdForCertificate > 0 ? "points" : "sessions",
    fee: activity?.fee?.toString() || "0",
    capacity: activity?.capacity?.toString() || "100",
    imageColor: activity?.imageColor || "emerald",
    status: activity?.status || "active",
    featured: activity?.featured || false,
    organizerName: activity?.organizerName || "",
    organizerLogo: activity?.organizerLogo || "",
    specialtyId: (activity as any)?.specialtyId || "",
  });
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetch("/api/specialties")
      .then((r) => r.json())
      .then((data) => setSpecialties(data.specialties || []))
      .catch(() => {});
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/activities/upload-logo", {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok && data.url) {
        updateForm("organizerLogo", data.url);
        showToast("تم رفع شعار الجهة المنظمة بنجاح", "success");
      } else {
        showToast(data.error || "فشل في رفع الشعار", "error");
      }
    } catch (e) {
      showToast("حدث خطأ أثناء رفع الشعار", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.startDate || !form.endDate) {
      showToast("يرجى تعبئة الحقول المطلوبة", "error");
      return;
    }
    setLoading(true);
    try {
      const url = activity ? `/api/activities/${activity.id}` : "/api/activities";
      const method = activity ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "فشل في الحفظ", "error");
        return;
      }
      showToast(activity ? "تم تحديث النشاط" : "تم إنشاء النشاط", "success");

      // If there are session slots, create them
      if (sessionSlots.length > 0 && data.activity) {
        for (const slot of sessionSlots) {
          if (slot.title && slot.startTime && slot.endTime) {
            await fetch(`/api/activities/${data.activity.id}/sessions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: slot.title,
                day: parseInt(slot.day) || 1,
                startTime: slot.startTime,
                endTime: slot.endTime,
                hasCustomCpd: parseFloat(slot.cpdPoints) > 0,
                cpdPoints: parseFloat(slot.cpdPoints) || 0,
              }),
            });
          }
        }
      }

      onSaved();
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "type") {
      const t = ACTIVITY_TYPES.find((x) => x.value === value);
      if (t) setForm((prev) => ({ ...prev, type: value, typeName: t.label, imageColor: t.color }));
    }
  };

  const updateSessionsCount = (count: number) => {
    updateForm("sessionsCount", count.toString());
    const newSlots = [];
    const cpdPerSession = parseFloat(form.cpdPoints) > 0 && count > 0
      ? (parseFloat(form.cpdPoints) / count).toFixed(1)
      : "0";
    for (let i = 0; i < count; i++) {
      if (sessionSlots[i]) {
        newSlots.push(sessionSlots[i]);
      } else {
        newSlots.push({
          title: `الفترة ${i + 1}`,
          day: "1",
          startTime: form.startDate || "",
          endTime: form.endDate || "",
          cpdPoints: cpdPerSession,
        });
      }
    }
    setSessionSlots(newSlots);
  };

  const updateSessionSlot = (index: number, key: string, value: string) => {
    setSessionSlots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleMapChange = (lat: number, lng: number, locationName?: string) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      location: locationName || prev.location,
    }));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              {activity ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </div>
            {activity ? "تعديل النشاط" : "إضافة نشاط جديد"}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات النشاط بدقة. يتم تحديد نقاط CPD والموقع من هذه الشاشة.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              البيانات الأساسية
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1">
              <MapPin className="h-3.5 w-3.5" />
              الموقع الجغرافي
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-1">
              <Settings className="h-3.5 w-3.5" />
              التفاصيل والرسوم
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Tab 1: Basic info */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">عنوان النشاط *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="مثال: المؤتمر الطبي السنوي 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">وصف النشاط</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="وصف موجز عن النشاط وأهدافه"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نوع النشاط *</Label>
                  <Select value={form.type} onValueChange={(v) => updateForm("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم الظاهر للنوع</Label>
                  <Input
                    value={form.typeName}
                    onChange={(e) => updateForm("typeName", e.target.value)}
                    placeholder="مؤتمر"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    تاريخ البداية *
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 10) : ""}
                    onChange={(e) => {
                      const time = form.startDate ? new Date(form.startDate).toISOString().slice(11, 16) : "09:00";
                      updateForm("startDate", `${e.target.value}T${time}`);
                    }}
                    required
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    تاريخ النهاية *
                  </Label>
                  <Input
                    type="date"
                    value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 10) : ""}
                    onChange={(e) => {
                      const time = form.endDate ? new Date(form.endDate).toISOString().slice(11, 16) : "17:00";
                      updateForm("endDate", `${e.target.value}T${time}`);
                    }}
                    required
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    وقت البداية
                  </Label>
                  <Input
                    type="time"
                    value={form.startDate ? new Date(form.startDate).toISOString().slice(11, 16) : "09:00"}
                    onChange={(e) => {
                      const date = form.startDate ? new Date(form.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                      updateForm("startDate", `${date}T${e.target.value}`);
                      // Also update timePeriod automatically
                      const endTime = form.endDate ? new Date(form.endDate).toISOString().slice(11, 16) : "17:00";
                      updateForm("timePeriod", `${e.target.value} - ${endTime}`);
                    }}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    وقت النهاية
                  </Label>
                  <Input
                    type="time"
                    value={form.endDate ? new Date(form.endDate).toISOString().slice(11, 16) : "17:00"}
                    onChange={(e) => {
                      const date = form.endDate ? new Date(form.endDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                      updateForm("endDate", `${date}T${e.target.value}`);
                      // Also update timePeriod automatically
                      const startTime = form.startDate ? new Date(form.startDate).toISOString().slice(11, 16) : "09:00";
                      updateForm("timePeriod", `${startTime} - ${e.target.value}`);
                    }}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => updateForm("featured", v)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    نشاط مميز
                  </p>
                  <p className="text-xs text-muted-foreground">يظهر في قسم "نشاطات مميزة" بالصفحة الرئيسية</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">اسم الجهة المنظمة</Label>
                  <Input
                    value={form.organizerName}
                    onChange={(e) => updateForm("organizerName", e.target.value)}
                    placeholder="مثال: الهيئة السورية للاختصاصات الطبية"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Upload className="h-4 w-4 text-emerald-600" />
                    شعار الجهة المنظمة (رفع من الجهاز)
                  </Label>
                  <div className="flex items-center gap-3">
                    {form.organizerLogo && (
                      <img src={form.organizerLogo} alt="شعار" className="h-20 w-20 object-contain rounded-lg border" />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP (الحد الأقصى 5 ميجا)</p>
                      {form.organizerLogo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateForm("organizerLogo", "")}
                          className="mt-1 text-rose-600 hover:bg-rose-50 h-7"
                        >
                          <X className="h-3 w-3 ml-1" />
                          حذف الشعار
                        </Button>
                      )}
                    </div>
                    {uploadingLogo && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Organizer info removed - merged into basic tab above */}

            {/* Tab 2: Location with Map Picker */}
            <TabsContent value="location" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  المحافظة
                </Label>
                <Select value={form.governorate || "none"} onValueChange={(v) => updateForm("governorate", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون محافظة —</SelectItem>
                    {SYRIAN_GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  المحافظة التي يقام فيها النشاط - تظهر في الشهادة
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  المكان (يظهر للمستخدمين) *
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) => updateForm("location", e.target.value)}
                  placeholder="مثال: قصر المؤتمرات - دمشق"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  عند تحديد موقع على الخريطة، يتم تعبئة هذا الحقل تلقائياً
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-emerald-600" />
                  حدد الموقع على الخريطة
                </Label>
                <MapPicker
                  latitude={parseFloat(form.latitude)}
                  longitude={parseFloat(form.longitude)}
                  radius={parseFloat(form.radius)}
                  onChange={handleMapChange}
                  initialLocationName={form.location}
                  height="350px"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">خط العرض (Latitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => updateForm("latitude", e.target.value)}
                    placeholder="33.5138"
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">خط الطول (Longitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => updateForm("longitude", e.target.value)}
                    placeholder="36.2765"
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نطاق السماح (متر)</Label>
                  <Input
                    type="number"
                    value={form.radius}
                    onChange={(e) => updateForm("radius", e.target.value)}
                    placeholder="100"
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                  <p className="text-xs text-muted-foreground">المسافة المسموح بها من الموقع</p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Details and Fee */}
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">عدد الأيام (يُحسب تلقائياً)</Label>
                  <Input
                    type="text"
                    value={
                      form.startDate && form.endDate
                        ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24))).toString()
                        : "1"
                    }
                    readOnly
                    className="ltr-text text-left bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">عدد الجلسات / الفترات</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={form.sessionsCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 1;
                      updateSessionsCount(count);
                    }}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>

                {/* Session Slots - shown when sessionsCount > 1 */}
                {sessionSlots.length > 1 && (
                  <div className="md:col-span-2 space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-800 mb-2">تحديد كل فترة (اليوم، الوقت، النقاط)</p>
                      <div className="space-y-3">
                        {sessionSlots.map((slot, idx) => (
                          <div key={idx} className="p-3 rounded-lg border bg-white space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                                {idx + 1}
                              </div>
                              <Input
                                value={slot.title}
                                onChange={(e) => updateSessionSlot(idx, "title", e.target.value)}
                                placeholder={`عنوان الفترة ${idx + 1}`}
                                className="text-sm h-8"
                              />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <Label className="text-[10px] text-muted-foreground">اليوم</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={slot.day}
                                  onChange={(e) => updateSessionSlot(idx, "day", e.target.value)}
                                  className="text-sm h-8 ltr-text"
                                  dir="ltr"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">وقت البداية</Label>
                                <Input
                                  type="datetime-local"
                                  value={slot.startTime}
                                  onChange={(e) => updateSessionSlot(idx, "startTime", e.target.value)}
                                  className="text-sm h-8 ltr-text"
                                  dir="ltr"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">وقت النهاية</Label>
                                <Input
                                  type="datetime-local"
                                  value={slot.endTime}
                                  onChange={(e) => updateSessionSlot(idx, "endTime", e.target.value)}
                                  className="text-sm h-8 ltr-text"
                                  dir="ltr"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">نقاط CPD</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={slot.cpdPoints}
                                  onChange={(e) => updateSessionSlot(idx, "cpdPoints", e.target.value)}
                                  className="text-sm h-8 ltr-text"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    الفترة الزمنية
                  </Label>
                  <Input
                    value={form.timePeriod}
                    onChange={(e) => updateForm("timePeriod", e.target.value)}
                    placeholder="9 صباحاً - 5 مساءً"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Timer className="h-4 w-4" />
                    عدد الساعات
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.hoursCount}
                    onChange={(e) => updateForm("hoursCount", e.target.value)}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-emerald-600" />
                    نقاط CPD للحضور (ممارس-حضور) — أقل
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.cpdPoints}
                    onChange={(e) => updateForm("cpdPoints", e.target.value)}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    تُقسّم تلقائياً على الجلسات ما لم تحدد نقاطاً مستقلة لكل جلسة
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-600" />
                    نقاط CPD للمشاركة (ممارس-مشاركة) — أعلى من الحضور
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.cpdPointsParticipation}
                    onChange={(e) => updateForm("cpdPointsParticipation", e.target.value)}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    المقيم: دائماً 0 نقطة (شهادة حضور بدون CPD)
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-rose-600" />
                    شروط الحصول على الشهادة
                  </Label>
                  <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={form.certRequirementType === "points"}
                        onCheckedChange={(v) => updateForm("certRequirementType", v ? "points" : "sessions")}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          شرط النقاط (وليس إكمال جميع الجلسات)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          عند التفعيل: يحصل المستخدم على الشهادة عند بلوغ عدد النقاط المحدد. عند الإيقاف: يجب إكمال جميع الجلسات.
                        </p>
                      </div>
                    </div>
                    {form.certRequirementType === "points" ? (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">عدد نقاط CPD المطلوبة</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={form.requiredCpdForCertificate}
                          onChange={(e) => updateForm("requiredCpdForCertificate", e.target.value)}
                          dir="ltr"
                          className="ltr-text text-left"
                          placeholder="مثال: 5"
                        />
                        <p className="text-xs text-amber-600">
                          مثال: 5 = يحصل المستخدم على الشهادة عند بلوغ 5 نقاط CPD
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        ✓ يجب على المستخدم إكمال جميع الجلسات ({form.sessionsCount || 1} جلسة) للحصول على الشهادة
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    الاختصاص
                  </Label>
                  <Select value={form.specialtyId || "none"} onValueChange={(v) => updateForm("specialtyId", v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="بدون اختصاص" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none">بدون اختصاص</SelectItem>
                      {specialties.length === 0 ? (
                        <SelectItem value="_empty" disabled>لا توجد اختصاصات - أضف اختصاصات من تبويب "الاختصاصات"</SelectItem>
                      ) : (
                        specialties.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.sliceName} - {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الرسوم (ل.س)</Label>
                  <Input
                    type="number"
                    value={form.fee}
                    onChange={(e) => updateForm("fee", e.target.value)}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                  <p className="text-xs text-amber-600">
                    رسوم المقيم = نصف المبلغ ({form.fee ? (parseFloat(form.fee) / 2).toLocaleString("ar-EG") : 0} ل.س) - تُحسب تلقائياً
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">السعة</Label>
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => updateForm("capacity", e.target.value)}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">لون البطاقة</Label>
                  <Select value={form.imageColor} onValueChange={(v) => updateForm("imageColor", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الحالة</Label>
                  <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="completed">منتهي</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <div className="flex gap-2">
                {activeTab !== "basic" && (
                  <Button type="button" variant="outline" onClick={() => setActiveTab(activeTab === "details" ? "location" : "basic")}>
                    السابق
                  </Button>
                )}
                {activeTab !== "details" ? (
                  <Button type="button" onClick={() => setActiveTab(activeTab === "basic" ? "location" : "details")}>
                    التالي
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      "حفظ النشاط"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Sessions Management Dialog - with per-session settings
function SessionsManagementDialog({
  activity,
  onClose,
  onSaved,
}: {
  activity: Activity;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useAppStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    day: "1",
    startTime: "",
    endTime: "",
    speaker: "",
    hasCustomLocation: false,
    location: "",
    latitude: "",
    longitude: "",
    radius: "100",
    hasCustomCpd: false,
    cpdPoints: "0",
  });
  const [saving, setSaving] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activities/${activity.id}/sessions`);
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      setSessions(data.sessions || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [activity.id]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      day: "1",
      startTime: "",
      endTime: "",
      speaker: "",
      hasCustomLocation: false,
      location: "",
      latitude: "",
      longitude: "",
      radius: "100",
      hasCustomCpd: false,
      cpdPoints: "0",
    });
    setEditingSession(null);
  };

  const handleEditSession = (s: Session) => {
    setForm({
      title: s.title,
      description: s.description || "",
      day: s.day.toString(),
      startTime: new Date(s.startTime).toISOString().slice(0, 16),
      endTime: new Date(s.endTime).toISOString().slice(0, 16),
      speaker: s.speaker || "",
      hasCustomLocation: s.hasCustomLocation || false,
      location: s.location || "",
      latitude: s.latitude?.toString() || "",
      longitude: s.longitude?.toString() || "",
      radius: s.radius?.toString() || "100",
      hasCustomCpd: s.hasCustomCpd || false,
      cpdPoints: s.cpdPoints?.toString() || "0",
    });
    setEditingSession(s);
    setShowForm(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startTime || !form.endTime) {
      showToast("يرجى تعبئة الحقول المطلوبة", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editingSession
        ? `/api/sessions/${editingSession.id}`
        : `/api/activities/${activity.id}/sessions`;
      const method = editingSession ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "فشل في الحفظ", "error");
        return;
      }
      showToast(editingSession ? "تم تحديث الجلسة" : "تم إضافة الجلسة", "success");
      resetForm();
      setShowForm(false);
      loadSessions();
      onSaved();
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الجلسة؟")) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("تم حذف الجلسة", "success");
        loadSessions();
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleMapChange = (lat: number, lng: number, locationName?: string) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      location: locationName || prev.location,
    }));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarDays className="h-4 w-4" />
            </div>
            إدارة جلسات النشاط
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{activity.title}</span> — إجمالي نقاط CPD: {activity.cpdPoints} • لكل جلسة: {sessions.length > 0 ? (activity.cpdPoints / sessions.length).toFixed(2) : activity.cpdPoints} نقطة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-2xl">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد جلسات. أضف جلسة للبدء</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s, idx) => (
                <div key={s.id} className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:shadow-modern transition-shadow">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatArabicDate(s.startTime)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(s.startTime)} - {formatTime(s.endTime)}
                      </span>
                      <Badge variant="outline" className="text-xs">اليوم {s.day}</Badge>
                    </div>
                    {/* Per-session info badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.speaker && (
                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                          <User className="h-3 w-3 ml-1" />
                          {s.speaker}
                        </Badge>
                      )}
                      {s.hasCustomLocation && s.location && (
                        <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                          <MapPin className="h-3 w-3 ml-1" />
                          موقع مخصص: {s.location}
                        </Badge>
                      )}
                      {s.hasCustomCpd && s.cpdPoints !== undefined && s.cpdPoints > 0 && (
                        <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700">
                          <Award className="h-3 w-3 ml-1" />
                          {s.cpdPoints} نقطة CPD مخصصة
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditSession(s)} className="h-8 w-8 rounded-lg">
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(s.id)} className="h-8 w-8 rounded-lg">
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="border-2 rounded-2xl p-4 space-y-3 bg-muted/20 border-emerald-300">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  {editingSession ? "تعديل الجلسة" : "إضافة جلسة جديدة"}
                </h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => { resetForm(); setShowForm(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">عنوان الجلسة *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: الجلسة الافتتاحية"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">وصف الجلسة</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف موجز للجلسة"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت البداية *</Label>
                  <Input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت النهاية *</Label>
                  <Input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">اليوم</Label>
                  <Input
                    type="number"
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    dir="ltr"
                    className="ltr-text text-left"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  المحاضر/المتحدث
                </Label>
                <Input
                  value={form.speaker}
                  onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                  placeholder="مثال: د. أحمد الخطيب"
                />
              </div>

              {/* Custom CPD toggle */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.hasCustomCpd}
                    onCheckedChange={(v) => setForm({ ...form, hasCustomCpd: v })}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600" />
                      تخصيص نقاط CPD لهذه الجلسة
                    </p>
                    <p className="text-xs text-muted-foreground">
                      إذا لم تُفعّل، ستُمنح تلقائياً (إجمالي نقاط النشاط ÷ عدد الجلسات)
                    </p>
                  </div>
                </div>
                {form.hasCustomCpd && (
                  <div className="space-y-2">
                    <Label className="text-xs">عدد نقاط CPD لهذه الجلسة</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.cpdPoints}
                      onChange={(e) => setForm({ ...form, cpdPoints: e.target.value })}
                      dir="ltr"
                      className="ltr-text text-left"
                    />
                  </div>
                )}
              </div>

              {/* Custom Location toggle */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.hasCustomLocation}
                    onCheckedChange={(v) => setForm({ ...form, hasCustomLocation: v })}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      تخصيص موقع هذه الجلسة
                    </p>
                    <p className="text-xs text-muted-foreground">
                      إذا لم تُفعّل، سيُستخدم موقع النشاط الأساسي للتحقق من الحضور
                    </p>
                  </div>
                </div>
                {form.hasCustomLocation && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">حدد موقع الجلسة على الخريطة</Label>
                    <MapPicker
                      latitude={form.latitude ? parseFloat(form.latitude) : undefined}
                      longitude={form.longitude ? parseFloat(form.longitude) : undefined}
                      radius={parseFloat(form.radius)}
                      onChange={handleMapChange}
                      initialLocationName={form.location}
                      height="280px"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        placeholder="خط العرض"
                        dir="ltr"
                        className="ltr-text text-left text-xs"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        placeholder="خط الطول"
                        dir="ltr"
                        className="ltr-text text-left text-xs"
                      />
                      <Input
                        type="number"
                        value={form.radius}
                        onChange={(e) => setForm({ ...form, radius: e.target.value })}
                        placeholder="نطاق (م)"
                        dir="ltr"
                        className="ltr-text text-left text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={() => handleSaveSession({ preventDefault: () => {} } as any)} disabled={saving} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine" size="sm">
                  {saving ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  {editingSession ? "حفظ التعديلات" : "إضافة الجلسة"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(false); }}>
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full bg-gradient-to-l from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 border-2 border-dashed border-emerald-300" variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              إضافة جلسة جديدة
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Participants Dialog (unchanged for now)
function ParticipantsDialog({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            المسجلون في النشاط
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{activity.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">
            {activity._count?.participants || 0} مسجل إجمالاً
          </p>
          <p className="text-xs mt-1">
            عرض التفاصيل الكاملة للمسجلين سيتم إضافته قريباً
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// FileText icon used for tabs/labels
function FileText({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
