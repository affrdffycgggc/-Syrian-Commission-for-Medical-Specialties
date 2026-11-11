"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Clock,
  Navigation,
  Loader2,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  Users,
  ChevronRight,
  AlertCircle,
  Timer,
  Lock,
  User,
  Sparkles,
  CheckCircle,
  Download,
} from "lucide-react";
import { formatArabicDate, formatArabicDateTime, formatTime } from "@/lib/helpers";
import { escapeHtml, sanitizeUrl, validateColor } from "@/lib/security";
import type { Session } from "@/lib/types";

interface AttendanceRecord {
  id: string;
  sessionId: string;
  verified: boolean;
  verifiedAt?: string;
  distance?: number;
  cpdAwarded: number;
}

export function AttendanceView() {
  const { selectedActivity, currentParticipant, setView, showToast } = useAppStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [totalCpd, setTotalCpd] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationState, setLocationState] = useState<{
    status: "idle" | "checking" | "verified" | "out_of_range" | "error";
    distance?: number;
    message?: string;
    latitude?: number;
    longitude?: number;
  }>({ status: "idle" });
  const [now, setNow] = useState(new Date());
  const [verifyingSessionId, setVerifyingSessionId] = useState<string | null>(null);
  const [sessionErrors, setSessionErrors] = useState<Record<string, string>>({});
  const [sessionSuccess, setSessionSuccess] = useState<Record<string, string>>({});
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentParticipant) return;
    loadAttendanceData();
  }, [currentParticipant]);

  const loadAttendanceData = async (autoTriggerCert = false) => {
    if (!currentParticipant || !selectedActivity) return;
    setLoading(true);
    try {
      // Get full activity with sessions (now includes per-session settings)
      const res = await fetch(`/api/activities/${selectedActivity.id}`);
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (data.activity?.sessions) {
        setSessions(data.activity.sessions);
      }

      // Get participant's attendances (with fresh participant data)
      const attRes = await fetch(`/api/attendance/verify?participantId=${currentParticipant.id}`);
      const attText = await attRes.text();
      const attData = attText ? JSON.parse(attText) : {};
      if (attData.participant) {
        // Update currentParticipant with fresh data from server (ensures latest fullName)
        if (attData.participant.fullName && attData.participant.fullName !== currentParticipant.fullName) {
          setCurrentParticipant(attData.participant);
        }
        setAttendances(attData.participant.attendances || []);
        setTotalCpd(attData.totalCpd || 0);
        setVerifiedCount(attData.verifiedCount || 0);

        // Auto-trigger certificate if user just became eligible
        if (autoTriggerCert && attData.canGetCertificate) {
          showToast("🎉 مبروك! أنت مؤهل للحصول على الشهادة - جاري التحميل...", "success");
          setTimeout(() => {
            downloadCertificatePDF(currentParticipant.id);
          }, 1500);
        }
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Download certificate as PDF automatically
  const downloadCertificatePDF = async (participantId: string) => {
    try {
      showToast("جاري تحضير الشهادة بصيغة PDF...", "info");

      // 1. Get certificate data
      const certRes = await fetch(`/api/certificates?participantId=${participantId}`);
      const certText = await certRes.text();
      const certData = certText ? JSON.parse(certText) : {};
      if (!certRes.ok) {
        showToast(certData.error || "لا يمكن إنشاء الشهادة", "error");
        return;
      }

      // 2. Get QR code
      const qrRes = await fetch(`/api/certificates/qr?participantId=${participantId}`);
      const qrText = await qrRes.text();
      const qrData = qrText ? JSON.parse(qrText) : {};
      const qrCode = qrRes.ok ? qrData.qrCode : null;
      const certRef = qrRes.ok ? qrData.certRef : `CERT-${participantId.slice(-8).toUpperCase()}`;

      // 3. Open certificate in new window with print-to-PDF option
      const certWindow = window.open("", "_blank", "width=1000,height=1300");
      if (!certWindow) {
        showToast("يرجى السماح بالنوافذ المنبثقة لتنزيل الشهادة", "error");
        return;
      }

      certWindow.document.write(generateCertificateHTML({ ...certData.certificate, qrCode, certRef }));
      certWindow.document.close();

      showToast("تم فتح الشهادة في نافذة جديدة - استخدم طباعة > حفظ كـ PDF", "success");
      setShowCertificate(true);
    } catch (e) {
      showToast("حدث خطأ أثناء تنزيل الشهادة", "error");
    }
  };

  if (!selectedActivity || !currentParticipant) {
    setView("home");
    return null;
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
        showToast("تم التحقق من موقعك بنجاح!", "success");
      } else {
        setLocationState({
          status: "out_of_range",
          distance,
          message: `أنت خارج الموقع المحدد. المسافة: ${Math.round(distance)} متر. يجب أن تكون ضمن ${selectedActivity.radius} متر`,
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

  const isSessionTimeActive = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const buffer = 30 * 60 * 1000;
    const bufStart = new Date(start.getTime() - buffer);
    const bufEnd = new Date(end.getTime() + buffer);
    if (now < bufStart) return { active: false, message: "لم تبدأ الجلسة بعد", startsIn: start.getTime() - now.getTime() };
    if (now > bufEnd) return { active: false, message: "انتهت الجلسة", startsIn: null };
    return { active: true, message: "الجلسة متاحة الآن", startsIn: null };
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "الآن";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} يوم و${hours % 24} ساعة`;
    if (hours > 0) return `${hours} ساعة و${minutes % 60} دقيقة`;
    if (minutes > 0) return `${minutes} دقيقة`;
    return `${seconds} ثانية`;
  };

  // Compute session's effective location for display
  const getSessionLocationInfo = (session: Session) => {
    if (session.hasCustomLocation && session.location) {
      return {
        location: session.location!,
        latitude: session.latitude!,
        longitude: session.longitude!,
        radius: session.radius || selectedActivity.radius,
        isCustom: true,
      };
    }
    return {
      location: selectedActivity.location,
      latitude: selectedActivity.latitude,
      longitude: selectedActivity.longitude,
      radius: selectedActivity.radius,
      isCustom: false,
    };
  };

  // Compute session's CPD to award
  const getSessionCpd = (session: Session): number => {
    if (session.hasCustomCpd && session.cpdPoints !== undefined && session.cpdPoints > 0) {
      return session.cpdPoints;
    }
    return sessions.length > 0 ? selectedActivity.cpdPoints / sessions.length : selectedActivity.cpdPoints;
  };

  const verifyAttendance = async (session: Session) => {
    setVerifyingSessionId(session.id);
    setSessionErrors((prev) => ({ ...prev, [session.id]: "" }));
    setSessionSuccess((prev) => ({ ...prev, [session.id]: "" }));

    if (locationState.status !== "verified" || !locationState.latitude || !locationState.longitude) {
      setSessionErrors((prev) => ({
        ...prev,
        [session.id]: "يجب التحقق من الموقع الجغرافي أولاً",
      }));
      showToast("يجب التحقق من الموقع أولاً", "error");
      setVerifyingSessionId(null);
      return;
    }

    const timeCheck = isSessionTimeActive(session.startTime, session.endTime);
    if (!timeCheck.active) {
      setSessionErrors((prev) => ({
        ...prev,
        [session.id]: timeCheck.message,
      }));
      showToast(timeCheck.message, "error");
      setVerifyingSessionId(null);
      return;
    }

    try {
      const res = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: currentParticipant.id,
          sessionId: session.id,
          latitude: locationState.latitude,
          longitude: locationState.longitude,
        }),
      });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setSessionErrors((prev) => ({ ...prev, [session.id]: data.error }));
        showToast(data.error, "error");
        return;
      }

      const successMsg = data.message || "تم تأكيد الحضور بنجاح!";
      setSessionSuccess((prev) => ({ ...prev, [session.id]: successMsg }));
      showToast(successMsg, "success");
      // After attendance, check if user is now eligible for certificate (auto-trigger)
      await loadAttendanceData(true);
    } catch (e) {
      setSessionErrors((prev) => ({
        ...prev,
        [session.id]: "حدث خطأ. حاول مرة أخرى",
      }));
    } finally {
      setVerifyingSessionId(null);
    }
  };

  const getSessionAttendance = (sessionId: string): AttendanceRecord | undefined => {
    return attendances.find((a) => a.sessionId === sessionId);
  };

  const totalProgress = sessions.length > 0 ? (verifiedCount / sessions.length) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("home")}
        className="mb-4 rounded-xl"
      >
        <ChevronRight className="h-4 w-4 ml-1" />
        عودة للنشاطات
      </Button>

      {/* Success banner - modern */}
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
                مرحباً <span className="font-semibold">{currentParticipant.fullName}</span> — الرجاء تأكيد حضورك لكل جلسة بالنقر على زر "تأكيد الحضور" من الموقع المحدد في الوقت المحدد
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

      {/* Stats - modern cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-2 border-emerald-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">نقاط CPD المكتسبة</p>
                <p className="text-3xl font-bold text-emerald-600">{totalCpd.toFixed(1)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">الجلسات المؤكدة</p>
                <p className="text-3xl font-bold text-blue-600">
                  {verifiedCount}<span className="text-base text-muted-foreground font-normal">/{sessions.length}</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">إجمالي نقاط النشاط</p>
                <p className="text-3xl font-bold text-amber-600">{selectedActivity.cpdPoints}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card className="mb-6 shadow-modern">
        <CardContent className="pt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              تقدم الحضور
            </span>
            <span className="text-sm text-muted-foreground">
              {verifiedCount} من {sessions.length} جلسة
            </span>
          </div>
          <Progress value={totalProgress} className="h-2.5 [&>div]:bg-gradient-to-l [&>div]:from-emerald-500 [&>div]:to-teal-500" />
        </CardContent>
      </Card>

      {/* Certificate Eligibility - shown when user meets the requirements */}
      {(() => {
        const requiredCpd = (selectedActivity as any).requiredCpdForCertificate || 0;
        const isEligible = requiredCpd > 0
          ? totalCpd >= requiredCpd
          : verifiedCount === sessions.length && sessions.length > 0;

        if (!isEligible) return null;

        return (
          <Card className="mb-6 border-2 border-emerald-300 bg-gradient-to-l from-emerald-50 to-teal-50 shadow-modern-lg">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-emerald-400/40 blur-xl rounded-full animate-pulse"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
                    <Award className="h-9 w-9" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-right">
                  <h3 className="text-xl font-bold text-emerald-800 mb-1">
                    🎉 تهانينا! أنت مؤهل للحصول على الشهادة
                  </h3>
                  <p className="text-sm text-emerald-700">
                    {requiredCpd > 0
                      ? `حصلت على ${totalCpd.toFixed(1)} نقطة CPD (المطلوب ${requiredCpd} نقطة)`
                      : `أكملت جميع الجلسات (${verifiedCount}/${sessions.length})`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCertificate(true)}
                    className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine h-12 px-6"
                    size="lg"
                  >
                    <Download className="h-5 w-5 ml-2" />
                    الحصول على الشهادة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Geolocation verification - modern */}
      <Card className="mb-6 border-2 border-dashed border-amber-300/60 bg-amber-50/30 shadow-modern">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Navigation className="h-4 w-4" />
            </div>
            التحقق من الموقع الجغرافي للحضور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/40">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الموقع المحدد للنشاط</p>
                  <p className="font-semibold">{selectedActivity.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/40">
                <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">نطاق السماح</p>
                  <p className="font-semibold">{selectedActivity.radius} متر</p>
                </div>
              </div>
            </div>

            <Button
              onClick={checkLocation}
              disabled={locationState.status === "checking"}
              className="w-full md:w-auto bg-gradient-to-l from-amber-500 to-orange-500 hover:opacity-90 text-white btn-shine h-12"
              size="lg"
            >
              {locationState.status === "checking" ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري تحديد موقعك...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 ml-2" />
                  التحقق من موقعي للحضور
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
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 location-active" />
                ) : (
                  <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
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
          </div>
        </CardContent>
      </Card>

      {/* Sessions list */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Users className="h-4 w-4" />
          </div>
          الجلسات وتأكيد الحضور
        </h3>
        {loading ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm text-muted-foreground">جاري تحميل الجلسات...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              لا توجد جلسات محددة لهذا النشاط
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, idx) => (
              <SessionAttendanceCard
                key={session.id}
                session={session}
                index={idx}
                attendance={getSessionAttendance(session.id)}
                locationOk={locationState.status === "verified"}
                timeCheck={isSessionTimeActive(session.startTime, session.endTime)}
                formatCountdown={formatCountdown}
                verifying={verifyingSessionId === session.id}
                error={sessionErrors[session.id]}
                onVerify={() => verifyAttendance(session)}
                getSessionLocationInfo={getSessionLocationInfo}
                getSessionCpd={getSessionCpd}
              />
            ))}
          </div>
        )}
      </div>

      {/* Final info */}
      <Card className="mt-6 bg-blue-50/50 border-blue-200 shadow-modern">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed">
                <li>يجب أن تكون في الموقع المحدد ({selectedActivity.location}) لتفعيل زر تأكيد الحضور</li>
                <li>لكل جلسة فترة زمنية محددة (مع 30 دقيقة سماح قبل وبعد)</li>
                <li>بعض الجلسات قد تكون في موقع مختلف — انظر بادج "موقع مخصص" إن وجد</li>
                <li>يتم منح نقاط CPD تلقائياً بعد تأكيد الحضور لكل جلسة</li>
                <li>إجمالي نقاط النشاط: {selectedActivity.cpdPoints} نقطة موزعة على {sessions.length} جلسة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Display Modal */}
      {showCertificate && (
        <CertificateModal
          participantId={currentParticipant.id}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}

// Certificate Modal Component
function CertificateModal({ participantId, onClose }: { participantId: string; onClose: () => void }) {
  const { showToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCertificate();
  }, [participantId]);

  const fetchCertificate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/certificates?participantId=${participantId}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error || "لا يمكن إنشاء الشهادة");
        return;
      }
      setCertData(data.certificate);
    } catch (e) {
      setError("حدث خطأ أثناء جلب الشهادة");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!certData) return;
    const certWindow = window.open("", "_blank", "width=900,height=1200");
    if (!certWindow) {
      showToast("يرجى السماح بالنوافذ المنبثقة", "error");
      return;
    }
    certWindow.document.write(generateCertificateHTML(certData));
    certWindow.document.close();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">جاري إنشاء الشهادة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-12 w-12 text-rose-500" />
            <h3 className="text-lg font-bold">لا يمكن إنشاء الشهادة</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={onClose} variant="outline">إغلاق</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!certData) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" />
            {certData.certificate.title}
          </h3>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm" className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white">
              <Download className="h-4 w-4 ml-1" />
              تحميل / طباعة
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              إغلاق
            </Button>
          </div>
        </div>

        <div className="p-4">
          {/* Certificate Preview - with watermark */}
          <CertificatePreview cert={certData} />
        </div>

        <div className="border-t p-4 bg-muted/30">
          <h4 className="font-semibold text-sm mb-2">معلومات الشهادة:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">المشارك:</span>{" "}
              <strong>{certData.participantName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">الرقم الوطني:</span>{" "}
              <strong dir="ltr" className="ltr-text">{certData.nationalId}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">الدور:</span>{" "}
              <strong>{certData.role === "resident" ? "مقيم" : "ممارس"}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">نوع المشاركة:</span>{" "}
              <strong>
                {certData.participationType === "participation" ? "مشاركة" : "حضور"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground">نقاط CPD:</span>{" "}
              <strong>{certData.cpd.totalCpd.toFixed(1)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">الجلسات المؤكدة:</span>{" "}
              <strong>{certData.verifiedSessions}/{certData.totalSessions}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Certificate Preview Component (inline with watermark)
function CertificatePreview({ cert }: { cert: any }) {
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
  const showCpd = cert.cpd.showCpd && cert.certificate.showCpdPoints;
  const totalCpd = cert.cpd.totalCpd;
  const borderColor = cert.certificate.borderColor;
  const backgroundColor = cert.certificate.backgroundColor;
  const governorate = cert.activity.governorate || "";

  return (
    <div
      className="relative mx-auto"
      style={{
        background: backgroundColor,
        border: `6px solid ${borderColor}`,
        width: "100%",
        minHeight: "500px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Watermark - شعار الهيئة كخلفية شفافة */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "300px",
          height: "300px",
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <img
          src="/logo-original.jpg"
          alt="شعار الهيئة السورية للاختصاصات الطبية"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      <div style={{ position: "absolute", top: "8px", right: "8px", bottom: "8px", left: "8px", border: `2px solid ${borderColor}`, pointerEvents: "none", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, padding: "20px" }}>
        {/* Logos */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {authorityLogo && <img src={authorityLogo} alt="شعار" style={{ maxHeight: "60px", maxWidth: "80px", objectFit: "contain" }} />}
            <span className="text-xs font-bold">{authorityName}</span>
          </div>
          <div className="text-center flex-1 px-4">
            <div className="font-bold text-base" style={{ color: borderColor }}>{headerText}</div>
          </div>
          <div className="flex items-center gap-2">
            {organizerLogo && <img src={organizerLogo} alt="منظم" style={{ maxHeight: "60px", maxWidth: "80px", objectFit: "contain" }} />}
            <span className="text-xs font-bold">{organizerName || cert.activity.organizerName || ""}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <div style={{ fontSize: "32px", fontWeight: "bold", color: borderColor, borderBottom: `3px double ${borderColor}`, display: "inline-block", padding: "5px 20px" }}>
            {certTitle}
          </div>
          {subtitle && <div className="text-sm text-muted-foreground mt-2">{subtitle}</div>}
        </div>

        {/* Participant Name */}
        <div className="text-center my-4">
          <div style={{ fontSize: "22px", fontWeight: "bold", borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, display: "inline-block", padding: "8px 24px" }}>
            {cert.participantName}
          </div>
        </div>

        {/* Body text */}
        <div className="text-center my-4 text-sm leading-loose px-8">{bodyText}</div>

        {/* Activity Info */}
        <div className="text-center my-3 text-sm">
          <p>نوع النشاط: <strong>{cert.activity.typeName || cert.activity.type}</strong></p>
          <p>اسم النشاط: <strong>{cert.activity.title}</strong></p>
          <p>اسم المشارك: <strong>{cert.participantName}</strong></p>
          <p>الرقم الوطني: <strong>{cert.nationalId}</strong></p>
          {governorate && <p>المحافظة: <strong>{governorate}</strong></p>}
          <p>المكان: <strong>{cert.activity.location}</strong></p>
          <p>التاريخ: <strong>من {new Date(cert.activity.startDate).toLocaleDateString("ar-EG")} إلى {new Date(cert.activity.endDate).toLocaleDateString("ar-EG")}</strong></p>
          <p>الفترة الزمنية: <strong>{cert.activity.timePeriod || ""}</strong></p>
          <p>عدد الأيام: <strong>{cert.activity.daysCount || 1} يوم</strong></p>
          <p>عدد الساعات: <strong>{cert.activity.hoursCount} ساعة</strong></p>
        </div>

        {/* CPD - at the bottom */}
        {showCpd && (
          <div className="text-center mt-8 p-3 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.08)", border: `1.5px solid ${borderColor}` }}>
            <div className="text-xs">نقاط CPD الممنوحة</div>
            <div style={{ fontSize: "22px", fontWeight: "bold", color: borderColor }}>{totalCpd.toFixed(1)} نقطة</div>
          </div>
        )}

        {/* Signatures */}
        <div className="flex justify-between mt-8 px-4">
          <div className="text-center">
            <div style={{ width: "150px", borderTop: "2px solid #333", marginBottom: "5px" }} />
            <div className="text-sm font-bold">{signatureText || "توقيع"}</div>
            <div className="text-xs text-muted-foreground">{authorityName}</div>
          </div>
          <div className="text-center">
            <div style={{ width: "150px", borderTop: "2px solid #333", marginBottom: "5px" }} />
            <div className="text-sm font-bold">رقم المرجع</div>
            <div className="text-xs text-muted-foreground font-mono">{cert.participantId.slice(-8).toUpperCase()}</div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-3">{footerText}</div>
      </div>
    </div>
  );
}

// Generate printable HTML certificate (with watermark)
function generateCertificateHTML(cert: any): string {
  // HTML-escape all user-controlled values to prevent XSS
  const e = escapeHtml;
  const su = sanitizeUrl;
  const vc = validateColor;

  const certTitle = e(cert.certificate.title);
  const subtitle = e(cert.certificate.subtitle || "");
  const headerText = e(cert.certificate.headerText);
  const bodyText = e(cert.certificate.bodyText);
  const footerText = e(cert.certificate.footerText);
  const signatureText = e(cert.certificate.signatureText);
  const authorityLogo = su(cert.certificate.authorityLogo);
  const authorityName = e(cert.certificate.authorityName);
  const organizerLogo = su(cert.certificate.organizerLogo);
  const organizerName = e(cert.certificate.organizerName || cert.activity.organizerName || "");
  const supportingLogos: string[] = (cert.certificate.supportingLogos || []).map((u: string) => su(u)).filter(Boolean);
  const showCpd = cert.cpd.showCpd && cert.certificate.showCpdPoints;
  const totalCpd = cert.cpd.totalCpd;
  const borderColor = vc(cert.certificate.borderColor);
  const backgroundColor = vc(cert.certificate.backgroundColor);
  const governorate = e(cert.activity.governorate || "");
  const qrCode = su(cert.qrCode);
  const certRef = e(cert.certRef || `CERT-${cert.participantId.slice(-8).toUpperCase()}`);
  const specialty = e(cert.activity.specialty?.name || "");

  // Escape participant/activity fields
  const participantName = e(cert.participantName);
  const nationalId = e(cert.nationalId);
  const activityTitle = e(cert.activity.title);
  const activityTypeName = e(cert.activity.typeName || cert.activity.type);
  const activityLocation = e(cert.activity.location);
  const activityTimePeriod = e(cert.activity.timePeriod || "");
  const activityHoursCount = e(cert.activity.hoursCount);
  const activityDaysCount = e(cert.activity.daysCount || 1);
  const startDate = new Date(cert.activity.startDate).toLocaleDateString("ar-EG");
  const endDate = new Date(cert.activity.endDate).toLocaleDateString("ar-EG");
  const issuedDate = new Date().toLocaleDateString("ar-EG");
  const watermarkLogo = su("/logo-original.jpg");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'none';">
<title>${certTitle} - ${participantName}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif; background: #f5f5f5; }

  .certificate {
    width: 297mm; height: 210mm;
    background: ${backgroundColor};
    border: 10px solid ${borderColor};
    margin: 20px auto;
    position: relative;
    padding: 35px 60px;
    box-shadow: 0 4px 30px rgba(0,0,0,0.1);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 500px; height: 500px;
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
  }
  .watermark img { width: 100%; height: 100%; object-fit: contain; }

  .certificate > *:not(.watermark) { position: relative; z-index: 2; }

  .inner-border {
    position: absolute; top: 14px; right: 14px; bottom: 14px; left: 14px;
    border: 2px solid ${borderColor};
    pointer-events: none;
    z-index: 1;
  }
  .inner-border::before {
    content: '';
    position: absolute; top: 4px; right: 4px; bottom: 4px; left: 4px;
    border: 1px solid ${borderColor};
    opacity: 0.5;
  }

  .corner {
    position: absolute;
    width: 60px; height: 60px;
    border: 3px solid ${borderColor};
    z-index: 2;
  }
  .corner-tl { top: 24px; right: 24px; border-bottom: none; border-left: none; }
  .corner-tr { top: 24px; left: 24px; border-bottom: none; border-right: none; }
  .corner-bl { bottom: 24px; right: 24px; border-top: none; border-left: none; }
  .corner-br { bottom: 24px; left: 24px; border-top: none; border-right: none; }

  .logos-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid ${borderColor}40;
  }
  .logo-side { display: flex; align-items: center; gap: 15px; }
  .logo-img { max-height: 90px; max-width: 130px; object-fit: contain; }
  .logo-text { font-size: 13px; color: #444; font-weight: bold; max-width: 140px; line-height: 1.3; }

  .header-center { text-align: center; flex: 1; }
  .header-center h1 { font-size: 26px; color: ${borderColor}; margin-bottom: 5px; font-weight: 800; letter-spacing: 1px; }
  .header-center p { font-size: 12px; color: #666; }

  .cert-title-section { text-align: center; margin: 30px 0 25px; }
  .cert-title {
    font-size: 56px; font-weight: 900; color: ${borderColor};
    padding: 12px 40px; display: inline-block;
    border-top: 3px double ${borderColor};
    border-bottom: 3px double ${borderColor};
    letter-spacing: 2px;
  }
  .cert-subtitle { font-size: 20px; color: #666; margin-top: 12px; font-style: italic; }

  .participant-name {
    text-align: center;
    font-size: 42px; font-weight: bold; color: #1a1a1a;
    margin: 25px auto; padding: 12px 40px;
    border-top: 2px solid ${borderColor};
    border-bottom: 2px solid ${borderColor};
    display: block; width: fit-content;
    letter-spacing: 1px;
  }

  .body-text {
    font-size: 19px; line-height: 2; color: #333;
    text-align: center; max-width: 85%; margin: 25px auto;
  }

  .activity-info {
    background: ${borderColor}08;
    border: 1.5px solid ${borderColor}40;
    border-radius: 12px;
    padding: 18px 25px;
    margin: 25px auto;
    max-width: 85%;
    text-align: center;
    font-size: 15px; color: #444;
    line-height: 1.9;
  }
  .activity-info p { margin-bottom: 4px; }
  .activity-info strong { color: ${borderColor}; font-weight: 700; }
  .activity-info .info-row { display: inline-block; margin: 0 15px; }

  .cpd-section {
    text-align: center; margin: 20px auto;
    padding: 18px;
    background: linear-gradient(135deg, ${borderColor}15, ${borderColor}25);
    border: 2px solid ${borderColor};
    border-radius: 12px;
    width: 60%;
  }
  .cpd-section .label { font-size: 15px; color: #555; margin-bottom: 5px; }
  .cpd-section .value { font-size: 32px; font-weight: 900; color: ${borderColor}; }
  .cpd-section .unit { font-size: 16px; color: #555; }

  .footer {
    margin-top: auto;
    padding-top: 25px;
    display: flex; justify-content: space-between; align-items: flex-end;
    border-top: 1px solid ${borderColor}40;
  }
  .signature { text-align: center; flex: 1; }
  .signature-line { width: 180px; border-top: 2px solid #333; margin: 0 auto 8px; }
  .signature-text { font-size: 14px; font-weight: bold; color: #333; }
  .signature-sub { font-size: 11px; color: #666; }

  .qr-section { text-align: center; flex: 0 0 auto; margin: 0 20px; }
  .qr-section img { width: 110px; height: 110px; object-fit: contain; }
  .qr-section .qr-label { font-size: 10px; color: #666; margin-top: 4px; }
  .qr-section .qr-ref { font-size: 11px; color: #444; font-weight: bold; font-family: monospace; }

  .supporting-logos {
    display: flex; gap: 20px; align-items: center; justify-content: center;
    margin-top: 15px;
  }
  .supporting-logos img { max-height: 50px; max-width: 100px; object-fit: contain; opacity: 0.9; }

  .footer-text { text-align: center; font-size: 11px; color: #888; margin-top: 15px; padding-top: 10px; border-top: 1px dashed ${borderColor}40; }

  @media print {
    body { background: white; }
    .certificate { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="certificate">
  <div class="inner-border"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>

  ${watermarkLogo ? `<div class="watermark">
    <img src="${watermarkLogo}" alt="watermark" />
  </div>` : ''}

  <div class="logos-top">
    <div class="logo-side">
      ${authorityLogo ? `<img src="${authorityLogo}" class="logo-img" alt="authority">` : ''}
      <div class="logo-text">${authorityName}</div>
    </div>
    <div class="header-center">
      <h1>${headerText}</h1>
      <p>المحافظة: ${governorate || "—"} | ${issuedDate}</p>
    </div>
    <div class="logo-side">
      ${organizerLogo ? `<img src="${organizerLogo}" class="logo-img" alt="organizer">` : ''}
      <div class="logo-text">${organizerName}</div>
    </div>
  </div>

  <div class="cert-title-section">
    <div class="cert-title">${certTitle}</div>
    ${subtitle ? `<div class="cert-subtitle">${subtitle}</div>` : ''}
  </div>

  <div class="participant-name">${participantName}</div>

  <div class="body-text">${bodyText}</div>

  <div class="activity-info">
    <p><strong>نوع النشاط:</strong> ${activityTypeName}
       <span class="info-row">|</span>
       <strong>اسم النشاط:</strong> ${activityTitle}</p>
    <p><strong>اسم المشارك:</strong> ${participantName}
       <span class="info-row">|</span>
       <strong>الرقم الوطني:</strong> ${nationalId}</p>
    <p><strong>المحافظة:</strong> ${governorate || "—"}
       <span class="info-row">|</span>
       <strong>المكان:</strong> ${activityLocation}</p>
    <p><strong>التاريخ:</strong> من ${startDate} إلى ${endDate}
       <span class="info-row">|</span>
       <strong>الفترة:</strong> ${activityTimePeriod || "—"}</p>
    <p><strong>عدد الأيام:</strong> ${activityDaysCount} يوم
       <span class="info-row">|</span>
       <strong>عدد الساعات:</strong> ${activityHoursCount} ساعة
       ${specialty ? `<span class="info-row">|</span><strong>الاختصاص:</strong> ${specialty}` : ''}</p>
  </div>

  ${supportingLogos.length > 0 ? `
  <div class="supporting-logos">
    ${supportingLogos.map((url: string) => `<img src="${url}" alt="logo">`).join("")}
  </div>
  ` : ''}

  ${showCpd ? `
  <div class="cpd-section">
    <div class="label">نقاط CPD الممنوحة</div>
    <div class="value">${totalCpd.toFixed(1)} <span class="unit">نقطة</span></div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-text">${signatureText || "توقيع"}</div>
      <div class="signature-sub">${authorityName || "الهيئة السورية للاختصاصات الطبية"}</div>
    </div>

    ${qrCode ? `
    <div class="qr-section">
      <img src="${qrCode}" alt="QR" />
      <div class="qr-label">امسح للتحقق</div>
      <div class="qr-ref">${certRef}</div>
    </div>
    ` : `
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-text">رقم المرجع</div>
      <div class="signature-sub" style="font-family: monospace;">${certRef}</div>
    </div>
    `}

    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-text">تاريخ الإصدار</div>
      <div class="signature-sub">${issuedDate}</div>
    </div>
  </div>

  <div class="footer-text">${footerText} | ${authorityName || "الهيئة السورية للاختصاصات الطبية"} | ${certRef}</div>
</div>
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 500);
  };
</script>
</body>
</html>`;
}

function SessionAttendanceCard({
  session,
  index,
  attendance,
  locationOk,
  timeCheck,
  formatCountdown,
  verifying,
  error,
  onVerify,
  getSessionLocationInfo,
  getSessionCpd,
}: {
  session: Session;
  index: number;
  attendance?: AttendanceRecord;
  locationOk: boolean;
  timeCheck: any;
  formatCountdown: (ms: number) => string;
  verifying: boolean;
  error?: string;
  onVerify: () => void;
  getSessionLocationInfo: (s: Session) => any;
  getSessionCpd: (s: Session) => number;
}) {
  const isVerified = attendance?.verified;
  const locInfo = getSessionLocationInfo(session);
  const cpdAward = getSessionCpd(session);

  return (
    <Card
      className={`border-2 shadow-modern transition-all ${
        isVerified
          ? "border-emerald-300 bg-emerald-50/30"
          : timeCheck.active
          ? "border-blue-200 bg-blue-50/20"
          : "border-muted"
      }`}
    >
      <CardContent className="pt-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Session info */}
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${
                isVerified
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isVerified ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <span className="font-bold">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-base leading-tight">
                  {session.title}
                </h4>
                {isVerified && (
                  <Badge className="bg-emerald-600 text-white flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    تم الحضور
                  </Badge>
                )}
              </div>
              {session.description && (
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                  {session.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatArabicDate(session.startTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>

              {/* Speaker badge */}
              {session.speaker && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 mr-1">
                  <User className="h-3 w-3 ml-1" />
                  {session.speaker}
                </Badge>
              )}

              {/* Custom location badge */}
              {session.hasCustomLocation && session.location && (
                <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 mr-1">
                  <MapPin className="h-3 w-3 ml-1" />
                  موقع مخصص: {session.location}
                </Badge>
              )}

              {/* Custom CPD badge */}
              {session.hasCustomCpd && session.cpdPoints !== undefined && session.cpdPoints > 0 && (
                <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700 mr-1">
                  <Award className="h-3 w-3 ml-1" />
                  {session.cpdPoints} نقطة مخصصة
                </Badge>
              )}

              {/* Verified status */}
              {isVerified && attendance?.verifiedAt && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-100/60 text-emerald-800 text-xs border border-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 inline ml-1" />
                  تم الحضور: {formatArabicDateTime(attendance.verifiedAt)}
                  {attendance.cpdAwarded > 0 && (
                    <span className="mr-2 font-semibold">• حصلت على {attendance.cpdAwarded.toFixed(1)} نقطة CPD</span>
                  )}
                </div>
              )}

              {/* Status badges (when not verified) */}
              {!isVerified && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant={locationOk ? "default" : "secondary"}
                    className={locationOk ? "bg-emerald-600" : ""}
                  >
                    <MapPin className="h-3 w-3 ml-1" />
                    {locationOk ? "الموقع متحقق" : "بانتظار التحقق من الموقع"}
                  </Badge>
                  <Badge
                    variant={timeCheck.active ? "default" : "secondary"}
                    className={timeCheck.active ? "bg-blue-600" : ""}
                  >
                    <Clock className="h-3 w-3 ml-1" />
                    {timeCheck.active
                      ? "الجلسة متاحة الآن"
                      : timeCheck.startsIn
                      ? `يبدأ خلال ${formatCountdown(timeCheck.startsIn)}`
                      : timeCheck.message}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                    <Award className="h-3 w-3 ml-1" />
                    {cpdAward.toFixed(1)} نقطة
                  </Badge>
                </div>
              )}

              {error && (
                <div className="mt-2 flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-300 p-2.5 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verify button */}
          {!isVerified && (
            <div className="md:w-48 flex-shrink-0">
              <Button
                onClick={onVerify}
                disabled={verifying || !locationOk || !timeCheck.active}
                className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed btn-shine"
                size="sm"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : !locationOk ? (
                  <>
                    <Lock className="h-4 w-4 ml-2" />
                    يجب التحقق من الموقع
                  </>
                ) : !timeCheck.active ? (
                  <>
                    <Clock className="h-4 w-4 ml-2" />
                    {timeCheck.message}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    تأكيد الحضور
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
