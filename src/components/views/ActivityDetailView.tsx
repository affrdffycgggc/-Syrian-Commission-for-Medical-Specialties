"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Award,
  ChevronRight,
  CalendarDays,
  Timer,
  Loader2,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Star,
} from "lucide-react";
import { formatArabicDate, formatArabicDateTime, formatTime } from "@/lib/helpers";
import { useGeolocation, useTimeCheck } from "@/hooks/use-geolocation";
import type { Session } from "@/lib/types";

const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string; soft: string }> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", gradient: "from-emerald-500 to-teal-600", soft: "bg-emerald-100/40" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", gradient: "from-teal-500 to-cyan-600", soft: "bg-teal-100/40" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", gradient: "from-cyan-500 to-blue-500", soft: "bg-cyan-100/40" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", gradient: "from-amber-500 to-orange-600", soft: "bg-amber-100/40" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", gradient: "from-rose-500 to-pink-600", soft: "bg-rose-100/40" },
};

export function ActivityDetailView() {
  const { selectedActivity, setView, showToast } = useAppStore();
  const [activity, setActivity] = useState(selectedActivity);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    { status: "idle" | "checking" | "verified" | "out_of_range" | "error"; distance?: number; message?: string }
  >({ status: "idle" });
  const geo = useGeolocation();

  const timeCheck = useTimeCheck(
    activity?.startDate || null,
    activity?.endDate || null,
    120
  );

  useEffect(() => {
    if (!activity) {
      setView("home");
    }
  }, [activity, setView]);

  if (!activity) return null;

  const colors = colorMap[activity.imageColor] || colorMap.emerald;
  const participantCount = activity._count?.participants || 0;
  const isFull = participantCount >= activity.capacity;

  const checkLocation = async () => {
    setCheckingLocation(true);
    setLocationStatus({ status: "checking" });
    try {
      const pos = await geo.getLocation();
      const R = 6371000;
      const dLat = ((activity.latitude - pos.latitude) * Math.PI) / 180;
      const dLon = ((activity.longitude - pos.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pos.latitude * Math.PI) / 180) *
          Math.cos((activity.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance <= activity.radius) {
        setLocationStatus({
          status: "verified",
          distance,
          message: `أنت ضمن الموقع المحدد (${Math.round(distance)} متر من ${activity.location})`,
        });
        showToast("تم التحقق من موقعك بنجاح!", "success");
      } else {
        setLocationStatus({
          status: "out_of_range",
          distance,
          message: `أنت خارج النطاق المحدد. المسافة: ${Math.round(distance)} متر. يجب أن تكون ضمن ${activity.radius} متر من ${activity.location}`,
        });
        showToast("أنت خارج الموقع المحدد", "error");
      }
    } catch (e: any) {
      setLocationStatus({ status: "error", message: e.message || "فشل في تحديد الموقع" });
      showToast(e.message || "فشل في تحديد الموقع", "error");
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleRegister = () => {
    setView("payment");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("home")}
        className="mb-4 rounded-xl"
      >
        <ChevronRight className="h-4 w-4 ml-1" />
        عودة للنشاطات
      </Button>

      {/* Activity header - modern hero card */}
      <Card className={`overflow-hidden border-2 ${colors.border} mb-6 shadow-modern-lg`}>
        <div className={`relative h-32 bg-gradient-to-l ${colors.gradient} p-6`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/40 blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-3 py-1.5 border border-white/30">
                <span className="text-sm font-bold text-white">{activity.typeName || activity.type}</span>
              </div>
              {activity.status === "active" && (
                <div className="bg-emerald-500 text-white rounded-2xl px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white status-dot"></span>
                  متاح للتسجيل
                </div>
              )}
            </div>
            <div className="text-left bg-white/15 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/20">
              <p className="text-[10px] text-white/80 leading-none">نقاط CPD</p>
              <p className="text-xl font-bold leading-tight">{activity.cpdPoints}</p>
            </div>
          </div>
        </div>
        <CardHeader className="pb-3">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {activity.title}
          </h1>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {activity.description}
          </p>

          {/* Info grid - modern cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoCard icon={MapPin} label="المكان" value={activity.location} colors={colors} highlighted />
            <InfoCard icon={FileText} label="نوع النشاط" value={activity.typeName || activity.type} />
            <InfoCard icon={Calendar} label="التاريخ" value={formatArabicDate(activity.startDate)} />
            <InfoCard icon={Users} label="عدد الجلسات" value={`${activity.sessionsCount} جلسة`} />
            <InfoCard icon={CalendarDays} label="عدد الأيام" value={`${activity.daysCount} يوم`} />
            <InfoCard icon={Clock} label="الفترة (الساعات)" value={activity.timePeriod} subValue={`${activity.hoursCount} ساعة`} />
            <InfoCard icon={Award} label="نقاط CPD" value={`${activity.cpdPoints} نقطة`} colors={colors} highlighted />
            <InfoCard icon={FileText} label="الرسوم" value={activity.fee === 0 ? "مجاناً" : `${activity.fee.toLocaleString("ar-EG")} ل.س`} />
            <InfoCard icon={Users} label="السعة" value={`${participantCount}/${activity.capacity}`} />
          </div>

          {/* Sessions list with per-session info */}
          {activity.sessions && activity.sessions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.bg}`}>
                  <Users className={`h-4 w-4 ${colors.text}`} />
                </div>
                الجلسات ({activity.sessions.length})
              </h3>
              <div className="space-y-2">
                {activity.sessions.map((s, idx) => (
                  <SessionCard key={s.id} session={s} index={idx} colors={colors} />
                ))}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Time status */}
          <div className={`mt-4 rounded-xl p-4 border ${
            timeCheck.active
              ? "border-emerald-500/50 bg-emerald-50/50 text-emerald-800"
              : "border-muted bg-muted/30 text-muted-foreground"
          }`}>
            <div className="flex items-center gap-2">
              {timeCheck.active ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              <p className="font-medium text-sm">
                {timeCheck.active
                  ? "ضمن الفترة الزمنية المحددة - يمكنك التسجيل"
                  : timeCheck.message}
              </p>
            </div>
          </div>

          {/* Register button - modern sticky - NO location check required before registering */}
          <div className="mt-6 sticky bottom-4 z-40">
            <Button
              onClick={handleRegister}
              disabled={isFull}
              size="lg"
              className={`w-full h-14 text-base font-bold bg-gradient-to-l ${colors.gradient} text-white shadow-modern-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed btn-shine`}
            >
              {isFull ? (
                "اكتمل العدد"
              ) : (
                <>
                  <FileText className="h-5 w-5 ml-2" />
                  تسجيل في {activity.title}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
  colors,
  highlighted = false,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  colors?: any;
  highlighted?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
      highlighted && colors
        ? `${colors.bg} ${colors.border}`
        : "bg-card border-border/60"
    }`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${
        highlighted && colors ? "bg-white/60" : "bg-muted/60"
      }`}>
        <Icon className={`h-4.5 w-4.5 ${highlighted && colors ? colors.text : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium leading-none">{label}</p>
        <p className="font-semibold text-sm leading-tight mt-1">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

function SessionCard({ session: s, index, colors }: { session: Session; index: number; colors: any }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border bg-card hover:bg-accent/30 transition-all`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg} ${colors.text} text-sm font-bold flex-shrink-0`}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{s.title}</p>
        {s.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{s.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2.5 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatArabicDate(s.startTime)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(s.startTime)} - {formatTime(s.endTime)}
          </span>
        </div>
        {/* Per-session info */}
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
              {s.location}
            </Badge>
          )}
          {s.hasCustomCpd && s.cpdPoints !== undefined && s.cpdPoints > 0 && (
            <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700">
              <Award className="h-3 w-3 ml-1" />
              {s.cpdPoints} CPD
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
