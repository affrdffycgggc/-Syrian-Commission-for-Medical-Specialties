"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ChevronRight,
  User,
  CreditCard,
  Stethoscope,
  GraduationCap,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  IdCard,
} from "lucide-react";
import type { Role } from "@/lib/types";

export function RegisterView() {
  const { selectedActivity, setView, setCurrentParticipant, showToast } = useAppStore();
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!selectedActivity) {
    setView("home");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nationalId || nationalId.length < 8) {
      setError("يرجى إدخال الرقم الوطني بشكل صحيح (8 أرقام على الأقل)");
      return;
    }
    if (!fullName || fullName.trim().split(/\s+/).length < 3) {
      setError("يرجى إدخال الاسم الثلاثي كاملاً");
      return;
    }
    if (!role) {
      setError("يرجى اختيار الصفة");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          nationalId,
          fullName: fullName.trim(),
          role,
        }),
      });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error || "فشل في التسجيل");
        return;
      }

      setCurrentParticipant(data.participant);
      showToast("تم تسجيلك بنجاح! الآن قم بتأكيد الدفع", "success");

      if (selectedActivity.fee === 0) {
        const payRes = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: data.participant.id,
            paymentMethod: "cash",
          }),
        });
        const payData = await payRes.json();
        if (payRes.ok) {
          setCurrentParticipant(payData.participant);
          showToast("النشاط مجاني - تم تفعيل حسابك للحضور", "success");
          setView("attendance");
        }
      } else {
        setView("payment");
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      setError("حدث خطأ. حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("activity_detail")}
        className="mb-4 rounded-xl"
      >
        <ChevronRight className="h-4 w-4 ml-1" />
        عودة لتفاصيل النشاط
      </Button>

      <Card className="border-2 border-emerald-200 shadow-modern-lg overflow-hidden">
        {/* Header with gradient */}
        <CardHeader className="bg-gradient-to-l from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-t-lg pb-6">
          <CardTitle className="text-2xl flex items-center gap-2 text-white">
            <User className="h-6 w-6" />
            تسجيل في النشاط
          </CardTitle>
          <p className="text-white/80 text-sm mt-2 flex items-center gap-2">
            <span className="bg-white/15 backdrop-blur-md rounded-lg px-2.5 py-0.5 text-xs font-semibold">
              {selectedActivity.typeName}
            </span>
            <span className="font-medium">{selectedActivity.title}</span>
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* National ID */}
            <div className="space-y-2">
              <Label htmlFor="nationalId" className="text-sm font-medium flex items-center gap-1.5">
                <IdCard className="h-4 w-4 text-emerald-600" />
                الرقم الوطني
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="nationalId"
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="أدخل الرقم الوطني"
                maxLength={12}
                required
                className="text-base ltr-text text-left h-12"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                أدخل الرقم الوطني كما هو في الهوية الشخصية
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4 text-emerald-600" />
                الاسم الثلاثي
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: محمد أحمد علي"
                required
                className="text-base h-12"
              />
              <p className="text-xs text-muted-foreground">
                أدخل الاسم الثلاثي كاملاً كما في الهوية
              </p>
            </div>

            {/* Role */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                الصفة
                <span className="text-rose-500">*</span>
              </Label>
              <RadioGroup
                value={role}
                onValueChange={(v: string) => setRole(v as Role)}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <label
                  htmlFor="role-practitioner"
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    role === "practitioner"
                      ? "border-emerald-500 bg-emerald-50 shadow-emerald"
                      : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
                  }`}
                >
                  <RadioGroupItem value="practitioner" id="role-practitioner" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        role === "practitioner" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <span className="font-semibold">ممارس</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                      طبيب ممارس أو اختصاصي يعمل في المجال
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="role-resident"
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    role === "resident"
                      ? "border-emerald-500 bg-emerald-50 shadow-emerald"
                      : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
                  }`}
                >
                  <RadioGroupItem value="resident" id="role-resident" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        role === "resident" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <span className="font-semibold">مقيم</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                      طبيب مقيم في برنامج الاختصاص
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/50 text-rose-800 text-sm flex items-start gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full h-12 text-base font-bold bg-gradient-to-l from-emerald-600 to-teal-600 text-white hover:opacity-90 btn-shine"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                  متابعة إلى الدفع
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              بالضغط على متابعة، أنت توافق على شروط التسجيل وتأكدت من صحة البيانات المدخلة
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
