"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Clock,
  Navigation,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Calendar,
  Award,
} from "lucide-react";
import { formatArabicDateTime } from "@/lib/helpers";

export function VerificationView() {
  const { selectedActivity, currentParticipant, setView, showToast } = useAppStore();
  const [locationState, setLocationState] = useState<{
    status: "idle" | "checking" | "verified" | "out_of_range" | "error";
    distance?: number;
    message?: string;
    latitude?: number;
    longitude?: number;
  }>({ status: "idle" });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!selectedActivity || !currentParticipant) {
    setView("home");
    return null;
  }

  // Verify that payment is approved before proceeding
  if (currentParticipant.paymentStatus !== "approved") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-rose-200 shadow-modern-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
                <XCircle className="h-9 w-9" />
              </div>
              <h2 className="text-xl font-bold text-rose-800 mb-2">الدفع غير مؤكد</h2>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                يجب إتمام الدفع والحصول على موافقة الإدارة قبل التحقق من الموقع والحضور.
              </p>
              <Button
                onClick={() => setView("payment")}
                className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white"
              >
                العودة لصفحة الدفع
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startTime = new Date(selectedActivity.startDate);
  const endTime = new Date(selectedActivity.endDate);
  const buffer = 120 * 60 * 1000;
  const bufferStart = new Date(startTime.getTime() - buffer);
  const bufferEnd = new Date(endTime.getTime() + buffer);

  let timeStatus: { active: boolean; message: string } = { active: false, message: "" };
  if (now < bufferStart) {
    const diff = startTime.getTime() - now.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    let msg = "النشاط يبدأ خلال ";
    if (days > 0) msg += `${days} يوم و`;
    if (hours > 0) msg += `${hours} ساعة و`;
    msg += `${minutes} دقيقة`;
    timeStatus = { active: false, message: msg };
  } else if (now > bufferEnd) {
    timeStatus = { active: false, message: "انتهت الفترة الزمنية للنشاط" };
  } else {
    timeStatus = { active: true, message: "ضمن الفترة الزمنية المحددة" };
  }

  const checkLocation = async () => {
    setLocationState({ status: "checking" });
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("المتصفح لا يدعم تحديد الموقع"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const R = 6371000;
      const dLat = ((selectedActivity.latitude - pos.coords.latitude) * Math.PI) / 180;
      const dLon = ((selectedActivity.longitude - pos.coords.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pos.coords.latitude * Math.PI) / 180) *
          Math.cos((selectedActivity.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance <= selectedActivity.radius) {
        setLocationState({
          status: "verified",
          distance,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          message: `أنت ضمن الموقع المحدد (${Math.round(distance)} متر من ${selectedActivity.location})`,
        });
        showToast("تم التحقق من موقعك بنجاح! يمكنك المضي للحضور", "success");
      } else {
        setLocationState({
          status: "out_of_range",
          distance,
          message: `أنت خارج الموقع المحدد. المسافة الحالية: ${Math.round(distance)} متر. يجب أن تكون ضمن ${selectedActivity.radius} متر من ${selectedActivity.location}`,
        });
        showToast("أنت خارج الموقع المحدد", "error");
      }
    } catch (e: any) {
      let msg = "فشل في تحديد الموقع";
      if (e.code === 1) msg = "تم رفض الإذن بالوصول للموقع. يجب السماح للوصول للموقع";
      else if (e.code === 2) msg = "الموقع غير متاح حالياً";
      else if (e.code === 3) msg = "انتهت المهلة المحددة لتحديد الموقع";
      setLocationState({ status: "error", message: msg });
      showToast(msg, "error");
    }
  };

  const handleProceed = () => {
    if (locationState.status !== "verified") {
      showToast("يجب التحقق من الموقع أولاً قبل المتابعة للحضور", "error");
      return;
    }
    setView("attendance");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("home")}
        className="mb-4 rounded-xl"
      >
        <ChevronRight className="h-4 w-4 ml-1" />
        عودة للنشاطات
      </Button>

      {/* Success payment banner */}
      <Card className="border-2 border-emerald-200 mb-6 bg-gradient-to-l from-emerald-50 to-teal-50 shadow-modern-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/40 blur-xl rounded-full animate-pulse"></div>
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-emerald-800 mb-1">
                تم تأكيد تسجيلك ودفعك بنجاح!
              </h2>
              <p className="text-sm text-emerald-700 leading-relaxed">
                مرحباً <span className="font-semibold">{currentParticipant.fullName}</span> — الخطوة التالية هي التحقق من الموقع الجغرافي. يجب أن تكون في موقع النشاط المحدد لتفعيل نظام الحضور.
              </p>
              {currentParticipant.paymentRef && (
                <p className="text-xs text-emerald-600 mt-2 font-mono ltr-text" dir="ltr">
                  رقم المرجع: {currentParticipant.paymentRef}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step indicator showing where we are */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-emerald-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">الدفع</span>
        </div>
        <div className="h-0.5 w-12 bg-emerald-300"></div>
        <div className="flex items-center gap-2 text-emerald-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold">
            2
          </div>
          <span className="text-sm font-medium">التحقق من الموقع</span>
        </div>
        <div className="h-0.5 w-12 bg-muted"></div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
            3
          </div>
          <span className="text-sm font-medium">الحضور</span>
        </div>
      </div>

      {/* Activity info recap */}
      <Card className="mb-6 border-2 border-emerald-200 shadow-modern">
        <CardHeader className="bg-gradient-to-l from-emerald-50 to-teal-50 rounded-t-lg">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            تفاصيل النشاط
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">وقت النشاط</p>
              <p className="text-sm font-semibold">{formatArabicDateTime(selectedActivity.startDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">الموقع</p>
              <p className="text-sm font-semibold">{selectedActivity.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border">
            <Navigation className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">نطاق السماح</p>
              <p className="text-sm font-semibold">{selectedActivity.radius} متر</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border">
            <Award className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">نقاط CPD</p>
              <p className="text-sm font-semibold">{selectedActivity.cpdPoints} نقطة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geolocation verification */}
      <Card className="mb-6 border-2 border-dashed border-amber-300/60 bg-amber-50/30 shadow-modern">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Navigation className="h-4 w-4" />
            </div>
            التحقق من الموقع الجغرافي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 leading-relaxed">
                <p className="font-semibold mb-1">تعليمات هامة:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>يجب أن تكون في موقع النشاط المحدد لتفعيل نظام الحضور</li>
                  <li>اسمح بالوصول إلى موقعك الجغرافي للتحقق</li>
                  <li>يجب أن تكون ضمن نطاق {selectedActivity.radius} متر من {selectedActivity.location}</li>
                  <li>النظام سيستخدم موقعك للتأكد من وجودك في المكان الصحيح</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={checkLocation}
              disabled={locationState.status === "checking"}
              className="w-full bg-gradient-to-l from-amber-500 to-orange-500 hover:opacity-90 text-white btn-shine h-14 text-base font-bold"
              size="lg"
            >
              {locationState.status === "checking" ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري تحديد موقعك...
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5 ml-2" />
                  التحقق من موقعي الجغرافي
                </>
              )}
            </Button>

            {locationState.status !== "idle" && locationState.status !== "checking" && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  locationState.status === "verified"
                    ? "border-emerald-500/50 bg-emerald-50 text-emerald-900"
                    : locationState.status === "out_of_range"
                    ? "border-rose-500/50 bg-rose-50 text-rose-900"
                    : "border-amber-500/50 bg-amber-50 text-amber-900"
                }`}
              >
                {locationState.status === "verified" ? (
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5 location-active" />
                ) : (
                  <XCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{locationState.message}</p>
                  {locationState.distance !== undefined && (
                    <p className="text-xs mt-1 opacity-80">
                      المسافة الحالية: {Math.round(locationState.distance)} متر
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Time status */}
            <div className={`rounded-xl p-4 border ${
              timeStatus.active
                ? "border-emerald-500/50 bg-emerald-50/50 text-emerald-800"
                : "border-muted bg-muted/30 text-muted-foreground"
            }`}>
              <div className="flex items-center gap-2">
                {timeStatus.active ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                <p className="font-medium text-sm">{timeStatus.message}</p>
              </div>
            </div>

            {/* Proceed button */}
            <Button
              onClick={handleProceed}
              disabled={locationState.status !== "verified" || !timeStatus.active}
              size="lg"
              className="w-full h-14 text-base font-bold bg-gradient-to-l from-emerald-600 to-teal-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed btn-shine"
            >
              {locationState.status !== "verified" ? (
                <>
                  <ShieldCheck className="h-5 w-5 ml-2" />
                  يجب التحقق من الموقع أولاً
                </>
              ) : !timeStatus.active ? (
                <>
                  <Clock className="h-5 w-5 ml-2" />
                  {timeStatus.message}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                  المتابعة إلى نظام الحضور
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
