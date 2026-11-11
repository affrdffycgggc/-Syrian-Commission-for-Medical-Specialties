"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Receipt,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  CreditCard,
  Wallet,
  Activity as ActivityIcon,
} from "lucide-react";

interface PaymentRequest {
  id: string;
  operationNumber: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  adminNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  participant: {
    id: string;
    nationalId: string;
    fullName: string;
    role: string;
    participationType?: string | null;
    activity: { id: string; title: string; fee: number; residentFee?: number; cpdPoints?: number; cpdPointsParticipation?: number };
  };
  paymentMethod: { id: string; name: string; walletCode?: string | null };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function PaymentRequestsManager() {
  const { showToast } = useAppStore();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [reviewing, setReviewing] = useState<PaymentRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment-requests?status=${filter}`);
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      if (filter === "pending" || filter === "all") {
        loadRequests();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleReview = (request: PaymentRequest, act: "approve" | "reject") => {
    setReviewing(request);
    setAction(act);
    setAdminNote("");
  };

  const confirmReview = async () => {
    if (!reviewing || !action) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/payment-requests/${reviewing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote }),
      });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "فشل في التحديث", "error");
        return;
      }
      showToast(action === "approve" ? "تمت الموافقة على طلب الدفع" : "تم رفض طلب الدفع", "success");
      setReviewing(null);
      setAction(null);
      setAdminNote("");
      loadRequests();
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-600" />
            طلبات الدفع
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            مراجعة طلبات الدفع المقدمة من المستخدمين - الموافقة أو الرفض
          </p>
        </div>
        <Button onClick={loadRequests} variant="outline">
          {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <ActivityIcon className="h-4 w-4 ml-2" />}
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-2 border-emerald-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">قيد المراجعة</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-emerald-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">مقبولة</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-rose-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">مرفوضة</p>
                <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "الكل", count: stats.total },
          { value: "pending", label: "قيد المراجعة", count: stats.pending },
          { value: "approved", label: "مقبولة", count: stats.approved },
          { value: "rejected", label: "مرفوضة", count: stats.rejected },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 px-4 h-9 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              filter === f.value
                ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-emerald"
                : "bg-white/80 hover:bg-emerald-50 text-muted-foreground border border-border"
            }`}
          >
            {f.label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${filter === f.value ? "bg-white/20" : "bg-muted"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <Card className="shadow-modern">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Receipt className="h-4 w-4" />
            </div>
            قائمة الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">لا توجد طلبات {filter !== "all" ? "بهذه الحالة" : ""}حالياً</p>
              <p className="text-xs mt-1">سيتم تحديث القائمة تلقائياً عند وصول طلبات جديدة</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>النشاط</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>رقم العملية</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-emerald-50/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex-shrink-0">
                            {req.participant.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{req.participant.fullName}</p>
                            <p className="text-xs text-muted-foreground ltr-text" dir="ltr">{req.participant.nationalId}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.participant.role === "practitioner"
                                ? `ممارس${req.participant.participationType === "participation" ? " - مشاركة" : req.participant.participationType === "attendance" ? " - حضور" : ""}`
                                : "مقيم"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px]">
                        <p className="line-clamp-2">{req.participant.activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          المطلوب: {(() => {
                            const fee = req.participant.role === "resident"
                              ? (req.participant.activity.residentFee ?? req.participant.activity.fee / 2)
                              : req.participant.activity.fee;
                            return fee.toLocaleString("ar-EG");
                          })()} ل.س
                          {req.participant.role === "resident" && (
                            <span className="text-purple-700"> (رسوم مقيم - نصف)</span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                          <div>
                            <p className="text-xs font-medium">{req.paymentMethod.name}</p>
                            {req.paymentMethod.walletCode && (
                              <p className="text-xs text-muted-foreground font-mono ltr-text" dir="ltr">
                                {req.paymentMethod.walletCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold ltr-text" dir="ltr">
                          {req.operationNumber}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {req.amount.toLocaleString("ar-EG")} ل.س
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(req.submittedAt).toLocaleDateString("ar-EG")}
                        <br />
                        <span className="text-[10px]">{new Date(req.submittedAt).toLocaleTimeString("ar-EG")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            req.status === "pending"
                              ? "bg-amber-50 border-amber-300 text-amber-700"
                              : req.status === "approved"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-rose-50 border-rose-300 text-rose-700"
                          }
                        >
                          {req.status === "pending" ? (
                            <><Clock className="h-3 w-3 ml-1" />قيد المراجعة</>
                          ) : req.status === "approved" ? (
                            <><CheckCircle2 className="h-3 w-3 ml-1" />مقبول</>
                          ) : (
                            <><XCircle className="h-3 w-3 ml-1" />مرفوض</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleReview(req, "approve")} className="text-emerald-700 hover:bg-emerald-50 h-8 px-2">
                              <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                              قبول
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReview(req, "reject")} className="text-rose-700 hover:bg-rose-50 h-8 px-2">
                              <XCircle className="h-3.5 w-3.5 ml-1" />
                              رفض
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {reviewing && action && (
        <Dialog open onOpenChange={(o) => !o && setReviewing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                {action === "approve" ? (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    الموافقة على طلب الدفع
                  </>
                ) : (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <XCircle className="h-5 w-5" />
                    </div>
                    رفض طلب الدفع
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {action === "approve"
                  ? "سيتم قبول الطلب ويمكن للمستخدم المتابعة للتحقق من الموقع والحضور"
                  : "سيتم رفض الطلب ويمكن للمستخدم إرسال طلب دفع جديد"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">المستخدم</p>
                  <p className="font-semibold text-sm">{reviewing.participant.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {reviewing.participant.role === "practitioner"
                      ? `ممارس${reviewing.participant.participationType === "participation" ? " - مشاركة" : reviewing.participant.participationType === "attendance" ? " - حضور" : ""}`
                      : "مقيم"} — <span className="ltr-text" dir="ltr">{reviewing.participant.nationalId}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">النشاط</p>
                  <p className="font-semibold text-sm">{reviewing.participant.activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    الرسوم المطلوبة: {(() => {
                      const fee = reviewing.participant.role === "resident"
                        ? (reviewing.participant.activity.residentFee ?? reviewing.participant.activity.fee / 2)
                        : reviewing.participant.activity.fee;
                      return fee.toLocaleString("ar-EG");
                    })()} ل.س
                    {reviewing.participant.role === "resident" && (
                      <span className="text-purple-700"> (رسوم المقيم - نصف)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">طريقة الدفع</p>
                  <p className="font-semibold text-sm">{reviewing.paymentMethod.name}</p>
                  {reviewing.paymentMethod.walletCode && (
                    <p className="text-xs text-muted-foreground font-mono ltr-text" dir="ltr">{reviewing.paymentMethod.walletCode}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">رقم العملية</p>
                  <p className="font-mono font-semibold text-sm ltr-text" dir="ltr">{reviewing.operationNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">المبلغ المدفوع</p>
                  <p className="font-bold text-sm">
                    {reviewing.amount.toLocaleString("ar-EG")} ل.س
                    {(() => {
                      const expectedFee = reviewing.participant.role === "resident"
                        ? (reviewing.participant.activity.residentFee ?? reviewing.participant.activity.fee / 2)
                        : reviewing.participant.activity.fee;
                      return reviewing.amount !== expectedFee && (
                        <span className="text-xs text-rose-600 mr-2">(المبلغ لا يطابق الرسوم المطلوبة {expectedFee.toLocaleString("ar-EG")} ل.س)</span>
                      );
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNote" className="text-sm font-medium">ملاحظة للمستخدم (اختياري)</Label>
              <Textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={action === "approve" ? "مثال: تم تأكيد استلام المبلغ بنجاح" : "مثال: رقم العملية غير صحيح، يرجى إرسال طلب جديد"}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewing(null)}>إلغاء</Button>
              <Button
                onClick={confirmReview}
                disabled={processing}
                className={action === "approve" ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white" : "bg-gradient-to-l from-rose-600 to-red-600 text-white"}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : action === "approve" ? (
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                ) : (
                  <XCircle className="h-4 w-4 ml-2" />
                )}
                {action === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
