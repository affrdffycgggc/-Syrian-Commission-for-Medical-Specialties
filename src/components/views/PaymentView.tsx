"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  User,
  Loader2,
  CheckCircle2,
  Lock,
  Receipt,
  IdCard,
  Stethoscope,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  QrCode,
  Wallet,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCcw,
  Upload,
  ImageIcon,
  Award,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentMethod {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  qrCode?: string | null;
  walletCode?: string | null;
  walletName?: string | null;
  instructions?: string | null;
  isManual: boolean;
  isActive: boolean;
  displayOrder: number;
}

export function PaymentView() {
  const { selectedActivity, setCurrentParticipant, currentParticipant, setView, showToast } = useAppStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [manualInstructions, setManualInstructions] = useState<string | null>(null);

  // Personal info
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"practitioner" | "resident" | "">("");
  const [participationType, setParticipationType] = useState<"participation" | "attendance" | "">("");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [operationNumber, setOperationNumber] = useState("");
  const [amount, setAmount] = useState<string>(selectedActivity?.fee?.toString() || "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // After submission
  const [pendingRequest, setPendingRequest] = useState<{
    id: string;
    status: "pending" | "approved" | "rejected";
    operationNumber?: string | null;
    amount: number;
    receiptImage?: string | null;
    adminNote?: string | null;
    submittedAt: string;
  } | null>(null);
  const [polling, setPolling] = useState(false);
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string; slice: string; sliceName: string; isActive: boolean }>>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");

  useEffect(() => {
    loadMethods();
    loadSettings();
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const res = await fetch("/api/specialties");
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setSpecialties(data.specialties || []);
      // If activity has a specialty, set it as default
      if (selectedActivity && (selectedActivity as any).specialtyId) {
        setSelectedSpecialtyId((selectedActivity as any).specialtyId);
      }
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (!pendingRequest || pendingRequest.status !== "pending") return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment-requests/status?participantId=${currentParticipant?.id}`);
        const text = await res.text(); const data = text ? JSON.parse(text) : {};
        if (data?.request && data.request.status !== "pending") {
          setPendingRequest({
            ...pendingRequest,
            status: data.request.status,
            adminNote: data.request.adminNote,
          });
          if (data.request.status === "approved") {
            showToast("تمت الموافقة على طلب الدفع! يمكنك المتابعة", "success");
          } else if (data.request.status === "rejected") {
            showToast(`تم رفض طلب الدفع. ${data.request.adminNote || "يرجى إرسال طلب جديد"}`, "error");
          }
        }
      } catch (e) {}
    }, 5000);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [pendingRequest, currentParticipant]);

  const loadMethods = async () => {
    setLoadingMethods(true);
    try {
      const res = await fetch("/api/payment-methods");
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      setMethods(data.methods || []);
    } catch (e) {
      // silent
    } finally {
      setLoadingMethods(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      setPaymentEnabled(data.paymentEnabled !== false);
      setManualInstructions(data.manualPaymentInstructions);
    } catch (e) {
      // silent
    }
  };

  if (!selectedActivity) {
    setView("home");
    return null;
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);
  const isManualMethod = selectedMethod?.isManual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate personal info
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

    // Validate participation type for practitioners
    if (role === "practitioner" && !participationType) {
      setError("يرجى اختيار نوع المشاركة (مشاركة أو حضور)");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create participant
      const regRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          nationalId,
          fullName: fullName.trim(),
          role,
          participationType: role === "practitioner" ? participationType : undefined,
        }),
      });
      const regText = await regRes.text();
      const regData = regText ? JSON.parse(regText) : {};
      if (!regRes.ok) {
        setError(regData.error || "فشل في التسجيل");
        return;
      }

      // Ensure participant has fullName (merge with form data as fallback)
      const participantData = regData.participant || {};
      const mergedParticipant = {
        ...participantData,
        fullName: participantData.fullName || fullName.trim(),
        nationalId: participantData.nationalId || nationalId,
        role: participantData.role || role,
        participationType: participantData.participationType || (role === "practitioner" ? participationType : null),
      };
      setCurrentParticipant(mergedParticipant);
      const applicableFee = regData.applicableFee ?? (role === "resident" ? (selectedActivity as any).residentFee : selectedActivity.fee);

      // If payment is disabled or skipped, go directly to attendance
      if (regData.paymentSkipped || !paymentEnabled || regData.alreadyApproved) {
        showToast("تم التسجيل بنجاح! يمكنك المضي للحضور", "success");
        setView("attendance");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      // Step 2: Submit payment request (if payment is enabled)
      if (!selectedMethodId) {
        setError("يرجى اختيار طريقة الدفع");
        setLoading(false);
        return;
      }

      const amountNum = parseFloat(amount);
      if (!amountNum || amountNum <= 0) {
        setError("يرجى إدخال المبلغ المدفوع");
        setLoading(false);
        return;
      }

      // Validate the amount matches the applicable fee
      if (Math.abs(amountNum - applicableFee) > 0.01) {
        setError(`المبلغ المدفوع (${amountNum.toLocaleString("ar-EG")} ل.س) لا يطابق الرسوم المطلوبة (${applicableFee.toLocaleString("ar-EG")} ل.س)`);
        setLoading(false);
        return;
      }

      // For manual methods, receipt image is required
      if (isManualMethod && !receiptFile) {
        setError("يرجى رفع صورة الإيصال");
        setLoading(false);
        return;
      }

      // For non-manual methods, operation number is required
      if (!isManualMethod && (!operationNumber || operationNumber.trim().length < 3)) {
        setError("يرجى إدخال رقم العملية");
        setLoading(false);
        return;
      }

      // Build FormData for payment request (supports receipt image upload)
      const formData = new FormData();
      formData.append("participantId", regData.participant.id);
      formData.append("activityId", selectedActivity.id);
      formData.append("paymentMethodId", selectedMethodId);
      formData.append("amount", amountNum.toString());
      if (!isManualMethod) {
        formData.append("operationNumber", operationNumber.trim());
      }
      if (receiptFile) {
        formData.append("receiptImage", receiptFile);
      }

      const payRes = await fetch("/api/payment-requests", {
        method: "POST",
        body: formData,
      });
      const payText = await payRes.text();
      const payData = payText ? JSON.parse(payText) : {};
      if (!payRes.ok) {
        setError(payData.error || "فشل في إرسال طلب الدفع");
        return;
      }

      if (payData.alreadyApproved) {
        setView("attendance");
        return;
      }

      if (payData.existingPending) {
        setPendingRequest({
          id: payData.request.id,
          status: "pending",
          operationNumber: payData.request.operationNumber,
          amount: payData.request.amount,
          receiptImage: payData.request.receiptImage,
          adminNote: null,
          submittedAt: payData.request.submittedAt,
        });
        showToast("لديك طلب دفع قيد المراجعة بالفعل", "info");
        return;
      }

      setPendingRequest({
        id: payData.request.id,
        status: "pending",
        operationNumber: payData.request.operationNumber,
        amount: payData.request.amount,
        receiptImage: payData.request.receiptImage,
        adminNote: null,
        submittedAt: payData.request.submittedAt,
      });
      showToast("تم إرسال طلب الدفع! في انتظار موافقة الإدارة", "success");
    } catch (e) {
      setError("حدث خطأ. حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedAfterApproval = () => {
    setView("attendance");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRetry = () => {
    setPendingRequest(null);
    setOperationNumber("");
    setReceiptFile(null);
    setReceiptPreview(null);
    setAmount(selectedActivity?.fee?.toString() || "");
    setError("");
  };

  // Render waiting status (pending/approved/rejected)
  if (pendingRequest) {
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

        {pendingRequest.status === "pending" && (
          <Card className="border-2 border-amber-300 shadow-modern-lg">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-400/40 blur-2xl rounded-full animate-pulse"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                    <Clock className="h-10 w-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-amber-800 mb-2">في انتظار موافقة الإدارة</h2>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-md">
                  تم إرسال طلب تأكيد الدفع بنجاح. يتم مراجعة طلبك من قبل الإدارة. سيتم تحديث الحالة تلقائياً عند الموافقة أو الرفض.
                </p>
                <Badge className="bg-amber-500 text-white mb-4 px-4 py-2 text-sm">
                  <Loader2 className="h-3.5 w-3.5 ml-2 animate-spin" />
                  {polling ? "جاري المراجعة..." : "قيد المراجعة"}
                </Badge>

                <div className="w-full max-w-md mt-2 space-y-2 text-sm bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                  {pendingRequest.operationNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم العملية:</span>
                      <span className="font-mono font-semibold ltr-text" dir="ltr">{pendingRequest.operationNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-semibold">{pendingRequest.amount.toLocaleString("ar-EG")} ل.س</span>
                  </div>
                  {pendingRequest.receiptImage && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">صورة الإيصال:</p>
                      <img src={pendingRequest.receiptImage} alt="إيصال" className="w-full max-w-xs mx-auto rounded-xl border" />
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ الإرسال:</span>
                    <span className="text-xs">{new Date(pendingRequest.submittedAt).toLocaleString("ar-EG")}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  يتم تحديث الحالة تلقائياً كل 5 ثوان
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingRequest.status === "approved" && (
          <Card className="border-2 border-emerald-300 shadow-modern-lg bg-emerald-50/30">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-400/40 blur-2xl rounded-full animate-pulse"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-emerald-800 mb-2">تمت الموافقة على طلب الدفع!</h2>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-md">
                  مبروك! تمت الموافقة على طلبك من قبل الإدارة. يمكنك الآن المتابعة لتأكيد الحضور.
                </p>

                <div className="w-full max-w-md mt-2 space-y-2 text-sm bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  {pendingRequest.operationNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم العملية:</span>
                      <span className="font-mono font-semibold ltr-text" dir="ltr">{pendingRequest.operationNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-semibold">{pendingRequest.amount.toLocaleString("ar-EG")} ل.س</span>
                  </div>
                  {pendingRequest.adminNote && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground block mb-1">ملاحظة الإدارة:</span>
                        <span className="text-sm">{pendingRequest.adminNote}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleProceedAfterApproval}
                  size="lg"
                  className="w-full max-w-md mt-6 h-12 text-base font-bold bg-gradient-to-l from-emerald-600 to-teal-600 text-white hover:opacity-90 btn-shine"
                >
                  المتابعة إلى الحضور
                  <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingRequest.status === "rejected" && (
          <Card className="border-2 border-rose-300 shadow-modern-lg bg-rose-50/30">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-rose-400/40 blur-2xl rounded-full"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
                    <XCircle className="h-10 w-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-rose-800 mb-2">تم رفض طلب الدفع</h2>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-md">
                  للأسف، تم رفض طلب الدفع من قبل الإدارة. يمكنك إرسال طلب جديد بعد مراجعة التفاصيل.
                </p>

                <div className="w-full max-w-md mt-2 space-y-2 text-sm bg-rose-50 p-4 rounded-xl border border-rose-200">
                  {pendingRequest.operationNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم العملية:</span>
                      <span className="font-mono font-semibold ltr-text" dir="ltr">{pendingRequest.operationNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-semibold">{pendingRequest.amount.toLocaleString("ar-EG")} ل.س</span>
                  </div>
                  {pendingRequest.adminNote && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground block mb-1">سبب الرفض:</span>
                        <span className="text-sm">{pendingRequest.adminNote}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleRetry}
                  size="lg"
                  variant="outline"
                  className="w-full max-w-md mt-6 h-12 text-base font-bold border-rose-400 text-rose-700 hover:bg-rose-50"
                >
                  إرسال طلب جديد
                  <RefreshCcw className="h-5 w-5 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Main registration + payment form
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("activity_detail")}
        className="mb-4 rounded-xl"
      >
        <ChevronRight className="h-4 w-4 ml-1" />
        عودة لتفاصيل النشاط
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-2 border-emerald-200 shadow-modern-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-t-lg pb-6">
              <CardTitle className="text-2xl flex items-center gap-2 text-white">
                <User className="h-6 w-6" />
                التسجيل في النشاط
              </CardTitle>
              <p className="text-white/80 text-sm mt-2">
                {paymentEnabled
                  ? "أدخل بياناتك وادفع رسوم النشاط لتأكيد التسجيل"
                  : "أدخل بياناتك للتسجيل في النشاط (الدفع غير مفعول حالياً)"}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Personal information section */}
                <div className="space-y-3">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm">1</div>
                    المعلومات الشخصية
                  </h3>

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
                      className="text-base ltr-text text-left h-12"
                      dir="ltr"
                    />
                  </div>

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
                      className="text-base h-12"
                    />
                  </div>

                  {/* Specialty dropdown - shown if the activity has specialties */}
                  {specialties.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="text-sm font-medium flex items-center gap-1.5">
                        <Stethoscope className="h-4 w-4 text-emerald-600" />
                        الاختصاص
                        {(selectedActivity as any)?.specialtyId ? (
                          <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700 mr-1">
                            {specialties.find(s => s.id === (selectedActivity as any).specialtyId)?.sliceName || ""}
                          </Badge>
                        ) : null}
                      </Label>
                      <Select
                        value={selectedSpecialtyId || "none"}
                        onValueChange={(v) => setSelectedSpecialtyId(v === "none" ? "" : v)}
                        disabled={!!(selectedActivity as any)?.specialtyId}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="اختر الاختصاص" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          <SelectItem value="none">— بدون اختصاص —</SelectItem>
                          {specialties.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.sliceName} - {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(selectedActivity as any)?.specialtyId && (
                        <p className="text-xs text-emerald-700">
                          الاختصاص مُحدد مسبقاً للنشاط
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      الصفة
                      <span className="text-rose-500">*</span>
                    </Label>
                    <RadioGroup
                      value={role}
                      onValueChange={(v: string) => {
                        setRole(v as "practitioner" | "resident");
                        // Set default amount based on role
                        if (v === "resident") {
                          setAmount(((selectedActivity as any).residentFee ?? (selectedActivity.fee / 2)).toString());
                          setParticipationType("");
                        } else {
                          setAmount(selectedActivity.fee.toString());
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <label
                        htmlFor="role-practitioner"
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          role === "practitioner" ? "border-emerald-500 bg-emerald-50 shadow-emerald" : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
                        }`}
                      >
                        <RadioGroupItem value="practitioner" id="role-practitioner" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${role === "practitioner" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                              <Stethoscope className="h-5 w-5" />
                            </div>
                            <span className="font-semibold">ممارس</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">طبيب ممارس أو اختصاصي يعمل في المجال</p>
                          {role === "practitioner" && (
                            <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                              الرسوم: {selectedActivity.fee.toLocaleString("ar-EG")} ل.س — CPD حضور: {selectedActivity.cpdPoints} (أقل) | CPD مشاركة: {(selectedActivity as any).cpdPointsParticipation || 0} (أعلى)
                            </div>
                          )}
                        </div>
                      </label>
                      <label
                        htmlFor="role-resident"
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          role === "resident" ? "border-emerald-500 bg-emerald-50 shadow-emerald" : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
                        }`}
                      >
                        <RadioGroupItem value="resident" id="role-resident" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${role === "resident" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <span className="font-semibold">مقيم</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">طبيب مقيم في برنامج الاختصاص</p>
                          {role === "resident" && (
                            <div className="mt-2 p-2 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-800">
                              الرسوم: {((selectedActivity as any).residentFee ?? (selectedActivity.fee / 2)).toLocaleString("ar-EG")} ل.س (نصف رسوم الممارس) — بدون نقاط CPD (شهادة حضور فقط)
                            </div>
                          )}
                        </div>
                      </label>
                    </RadioGroup>

                    {/* Participation Type - only for practitioners */}
                    {role === "practitioner" && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-emerald-600" />
                          نوع المشاركة
                          <span className="text-rose-500">*</span>
                        </Label>
                        <RadioGroup
                          value={participationType}
                          onValueChange={(v: string) => setParticipationType(v as "participation" | "attendance")}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2"
                        >
                          <label
                            htmlFor="part-attendance"
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              participationType === "attendance" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"
                            }`}
                          >
                            <RadioGroupItem value="attendance" id="part-attendance" className="mt-1" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">حضور</p>
                              <p className="text-xs text-muted-foreground">حضور الجلسات — نقاط CPD أقل ({selectedActivity.cpdPoints} نقطة)</p>
                            </div>
                          </label>
                          <label
                            htmlFor="part-participation"
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              participationType === "participation" ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"
                            }`}
                          >
                            <RadioGroupItem value="participation" id="part-participation" className="mt-1" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">مشاركة</p>
                              <p className="text-xs text-muted-foreground">المشاركة الفعالة (تقديم/تنظيم) — نقاط CPD أعلى ({(selectedActivity as any).cpdPointsParticipation || 0} نقطة)</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment section - only shown if payment is enabled */}
                {paymentEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm">2</div>
                        طريقة الدفع
                      </h3>

                      {loadingMethods ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                      ) : methods.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
                          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">لا توجد طرق دفع متاحة حالياً</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {methods.map((method) => {
                            const isSelected = selectedMethodId === method.id;
                            return (
                              <label
                                key={method.id}
                                htmlFor={`method-${method.id}`}
                                className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected ? "border-emerald-500 bg-emerald-50 shadow-emerald" : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
                                }`}
                              >
                                <input
                                  type="radio"
                                  id={`method-${method.id}`}
                                  name="paymentMethod"
                                  value={method.id}
                                  checked={isSelected}
                                  onChange={() => { setSelectedMethodId(method.id); setError(""); }}
                                  className="mt-1 h-4 w-4 accent-emerald-600"
                                />
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-emerald-200 flex-shrink-0 overflow-hidden">
                                  {method.image ? (
                                    <img src={method.image} alt={method.name} className="h-8 w-8 object-contain" />
                                  ) : (
                                    <Wallet className="h-5 w-5 text-emerald-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{method.name}</p>
                                  {method.isManual && (
                                    <Badge variant="outline" className="mt-1 text-xs bg-amber-50 border-amber-300 text-amber-700">
                                      <Upload className="h-3 w-3 ml-1" />
                                      يتطلب رفع إيصال
                                    </Badge>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected method details */}
                      {selectedMethod && (
                        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                          <p className="font-semibold text-sm">{selectedMethod.name}</p>
                          {selectedMethod.walletCode && (
                            <p className="text-xs text-emerald-700 font-mono ltr-text" dir="ltr">{selectedMethod.walletCode}</p>
                          )}
                          {selectedMethod.qrCode && (
                            <img src={selectedMethod.qrCode} alt="QR" className="h-32 w-32 mx-auto" />
                          )}
                          {selectedMethod.instructions && (
                            <p className="text-xs text-muted-foreground whitespace-pre-line">{selectedMethod.instructions}</p>
                          )}
                        </div>
                      )}

                      {/* Amount + operation number (for non-manual methods) */}
                      {selectedMethodId && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-1.5">
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                              المبلغ المدفوع (ل.س)
                              <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              step="any"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder={(role === "resident"
                                ? ((selectedActivity as any).residentFee ?? (selectedActivity.fee / 2))
                                : selectedActivity.fee
                              ).toString()}
                              className="text-base ltr-text text-left h-12"
                              dir="ltr"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              المبلغ المطلوب: {(role === "resident"
                                ? ((selectedActivity as any).residentFee ?? (selectedActivity.fee / 2))
                                : selectedActivity.fee
                              ).toLocaleString("ar-EG")} ل.س
                              {role === "resident" && (
                                <span className="text-purple-700"> (نصف رسوم الممارس)</span>
                              )}
                            </p>
                          </div>

                          {/* Operation number (for non-manual methods) */}
                          {!isManualMethod && (
                            <div className="space-y-2">
                              <Label htmlFor="operationNumber" className="text-sm font-medium flex items-center gap-1.5">
                                <Receipt className="h-4 w-4 text-emerald-600" />
                                رقم العملية / الإيصال
                                <span className="text-rose-500">*</span>
                              </Label>
                              <Input
                                id="operationNumber"
                                type="text"
                                value={operationNumber}
                                onChange={(e) => setOperationNumber(e.target.value)}
                                placeholder="أدخل رقم العملية"
                                className="text-base ltr-text text-left h-12"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {/* Receipt image upload (for manual methods) */}
                          {isManualMethod && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-1.5">
                                <Upload className="h-4 w-4 text-emerald-600" />
                                صورة الإيصال
                                <span className="text-rose-500">*</span>
                              </Label>
                              <div className="flex items-center gap-3">
                                <div className="h-24 w-24 rounded-xl border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden bg-emerald-50/30 flex-shrink-0">
                                  {receiptPreview ? (
                                    <img src={receiptPreview} alt="معاينة" className="h-full w-full object-contain" />
                                  ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleReceiptChange}
                                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG (يفضل واضحة الإضاءة)</p>
                                </div>
                              </div>
                              {manualInstructions && (
                                <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">{manualInstructions}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/50 text-rose-800 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Submit button */}
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
                  ) : paymentEnabled ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 ml-2" />
                      تسجيل وإرسال طلب الدفع
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 ml-2" />
                      تسجيل والمتابعة للحضور
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  {paymentEnabled
                    ? "سيتم مراجعة طلبك من قبل الإدارة. ستظهر حالة الطلب على هذه الصفحة. عند الموافقة، يمكنك متابعة الحضور."
                    : "تم إيقاف نظام الدفع حالياً. سيتم تسجيلك مباشرة والانتقال إلى صفحة الحضور."}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-44 border-2 border-emerald-200 shadow-modern">
            <CardHeader className="bg-gradient-to-l from-emerald-50 to-teal-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-5 w-5 text-emerald-600" />
                ملخص الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">النشاط</p>
                <p className="font-semibold text-sm leading-tight">{selectedActivity.title}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">المكان</p>
                <p className="font-medium text-sm">{selectedActivity.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="font-medium text-sm">{new Date(selectedActivity.startDate).toLocaleDateString("ar-EG")}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">طريقة الدفع</p>
                <p className="font-medium text-sm">
                  {paymentEnabled
                    ? selectedMethod ? selectedMethod.name : "لم يتم الاختيار"
                    : "الدفع غير مفعول"}
                </p>
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">الإجمالي</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {paymentEnabled ? (
                      <>
                        {(role === "resident"
                          ? ((selectedActivity as any).residentFee ?? (selectedActivity.fee / 2))
                          : selectedActivity.fee
                        ).toLocaleString("ar-EG")}
                        <span className="text-sm font-normal"> ل.س</span>
                      </>
                    ) : (
                      <span className="text-base text-emerald-600">مجاناً (الدفع معطّل)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-muted-foreground">نقاط CPD</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {role === "resident" ? (
                      <span className="text-purple-700">0 (مقيم - بدون CPD)</span>
                    ) : role === "practitioner" && participationType === "participation" ? (
                      `${(selectedActivity as any).cpdPointsParticipation || 0} (مشاركة - أعلى)`
                    ) : role === "practitioner" && participationType === "attendance" ? (
                      `${selectedActivity.cpdPoints} (حضور - أقل)`
                    ) : (
                      selectedActivity.cpdPoints
                    )}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <Lock className="h-3.5 w-3.5" />
                  <span>معاملة آمنة — مراجعة يدوية من الإدارة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
