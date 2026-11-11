"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Award,
  ChevronLeft,
  CalendarDays,
  Timer,
  Loader2,
  RefreshCcw,
  Sparkles,
  Search,
} from "lucide-react";
import { formatArabicDate } from "@/lib/helpers";

const colorMap: Record<string, {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  soft: string;
}> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-600 via-teal-600 to-emerald-700",
    soft: "bg-emerald-100/40",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    gradient: "from-teal-600 via-cyan-600 to-teal-700",
    soft: "bg-teal-100/40",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    gradient: "from-cyan-600 via-blue-600 to-cyan-700",
    soft: "bg-cyan-100/40",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    soft: "bg-amber-100/40",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    gradient: "from-rose-500 via-pink-500 to-rose-600",
    soft: "bg-rose-100/40",
  },
};

export function ActivitiesListView() {
  const { setSelectedActivity, setView } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      if (!res.ok) {
        setActivities([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setActivities([]);
        return;
      }
      const data = JSON.parse(text);
      setActivities(data.activities || []);
    } catch (e) {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // Timeout fallback - don't stay loading forever
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  const openActivity = (a: Activity) => {
    setSelectedActivity(a);
    setView("activity_detail");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredActivities = activities.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (search && !a.title.includes(search) && !a.location.includes(search)) return false;
    return true;
  });

  const featuredActivities = filteredActivities.filter((a) => a.featured);
  const regularActivities = filteredActivities.filter((a) => !a.featured);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-8 md:p-12 text-white shadow-2xl shadow-emerald-700/30 animate-fadeInUp">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl animate-float"></div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-amber-300/40"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${(i * 6.5) % 100}%`,
                top: `${15 + (i % 4) * 20}%`,
                animation: `float ${2.5 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-3 tracking-tight animate-fadeInUp">
            نظام نشاطات والمؤتمرات
          </h2>
        </div>
      </section>

      {/* Search and filter */}
      <section className="mb-6 glass rounded-2xl p-4 shadow-modern border border-white/30">
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ابحث عن نشاط أو مكان..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-white/80 px-4 pr-10 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {[
              { value: "all", label: "الكل" },
              { value: "conference", label: "مؤتمر" },
              { value: "scientific_day", label: "يوم علمي" },
              { value: "discussion_session", label: "جلسة حوارية" },
              { value: "workshop", label: "ورشة عمل" },
              { value: "seminar", label: "ندوة" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 px-4 h-9 rounded-xl text-sm font-medium transition-all ${
                  filter === f.value
                    ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-emerald"
                    : "bg-white/80 hover:bg-emerald-50 text-muted-foreground border border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivities}
            className="h-11 rounded-xl"
          >
            <RefreshCcw className="h-4 w-4 ml-1.5" />
            تحديث
          </Button>
        </div>
      </section>

      {/* Featured activities */}
      {!loading && featuredActivities.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold">نشاطات مميزة</h3>
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              {featuredActivities.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredActivities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                featured={true}
                onOpen={() => openActivity(a)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All activities */}
      <section>
        {featuredActivities.length > 0 && regularActivities.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold">جميع النشاطات</h3>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700">
              {regularActivities.length}
            </Badge>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-muted-foreground">جاري تحميل النشاطات...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-24 glass rounded-3xl">
            <CalendarDays className="h-14 w-14 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">لا توجد نشاطات مطابقة</p>
            <p className="text-sm text-muted-foreground mt-1">جرّب تغيير البحث أو الفلتر</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(featuredActivities.length > 0 ? regularActivities : filteredActivities).map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                onOpen={() => openActivity(a)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ActivityCard({
  activity: a,
  featured = false,
  onOpen,
}: {
  activity: Activity;
  featured?: boolean;
  onOpen: () => void;
}) {
  const colors = colorMap[a.imageColor] || colorMap.emerald;
  const participantCount = a._count?.participants || 0;
  const progress = Math.min(100, (participantCount / a.capacity) * 100);
  const isFull = participantCount >= a.capacity;

  return (
    <Card
      className={`card-hover overflow-hidden border-2 ${colors.border} cursor-pointer ${
        featured ? "ring-2 ring-amber-300/40" : ""
      }`}
      onClick={onOpen}
    >
      <div className={`relative h-24 bg-gradient-to-l ${colors.gradient} p-4`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/30 blur-2xl"></div>
        </div>
        <div className="relative z-10 flex items-start justify-between h-full">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-white">
                {a.typeName || a.type}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            {featured && (
              <div className="bg-amber-400 text-amber-900 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                مميز
              </div>
            )}
            {isFull ? (
              <div className="bg-rose-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                اكتمل
              </div>
            ) : a.status === "completed" ? (
              <div className="bg-gray-700 text-white rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                منتهي
              </div>
            ) : (
              <div className="bg-emerald-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white status-dot"></span>
                متاح
              </div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-5 right-4 flex items-center gap-1.5 bg-white rounded-2xl shadow-lg p-2.5 pr-3 pl-3 border border-emerald-200">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.bg}`}>
            <Award className={`h-4 w-4 ${colors.text}`} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-none font-medium">نقاط CPD</p>
            <p className={`text-base font-bold leading-tight ${colors.text}`}>{a.cpdPoints}</p>
          </div>
        </div>
      </div>

      <CardHeader className="pb-2 pt-7">
        <h3 className="text-lg font-bold leading-tight line-clamp-2">
          {a.title}
        </h3>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {a.description}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/40">
            <MapPin className={`h-4 w-4 ${colors.text} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">المكان</p>
              <p className="text-xs font-semibold truncate leading-tight mt-0.5">{a.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/40">
            <Calendar className={`h-4 w-4 ${colors.text} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">التاريخ</p>
              <p className="text-xs font-semibold truncate leading-tight mt-0.5">
                {formatArabicDate(a.startDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/40">
            <Clock className={`h-4 w-4 ${colors.text} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">الفترة</p>
              <p className="text-xs font-semibold truncate leading-tight mt-0.5">{a.timePeriod}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/40">
            <Users className={`h-4 w-4 ${colors.text} flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">الجلسات</p>
              <p className="text-xs font-semibold truncate leading-tight mt-0.5">
                {a.sessionsCount} جلسة • {a.daysCount} يوم
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          <div>
            <p className="text-[10px] text-muted-foreground">الرسوم</p>
            <p className="text-base font-bold">
              {a.fee === 0 ? (
                <span className="text-emerald-600">مجاناً</span>
              ) : (
                <span>
                  {a.fee.toLocaleString("ar-EG")}
                  <span className="text-xs font-normal text-muted-foreground mr-1">ل.س</span>
                </span>
              )}
            </p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground">السعة</p>
            <p className="text-sm font-bold">
              <span className={isFull ? "text-rose-600" : "text-emerald-600"}>
                {participantCount}
              </span>
              <span className="text-muted-foreground">/{a.capacity}</span>
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Progress
            value={progress}
            className={`h-1.5 ${progress >= 100 ? "[&>div]:bg-rose-500" : `[&>div]:bg-gradient-to-l ${colors.gradient}`}`}
          />
        </div>

        <Button
          className={`w-full h-10 rounded-xl bg-gradient-to-l ${colors.gradient} text-white hover:opacity-90 btn-shine font-semibold`}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          التفاصيل والتسجيل
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
