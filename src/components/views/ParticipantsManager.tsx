"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Loader2, CheckCircle2, XCircle, Clock, Award, MapPin,
} from "lucide-react";

interface Participant {
  id: string;
  nationalId: string;
  fullName: string;
  role: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentRef?: string;
  registeredAt: string;
  activity: { id: string; title: string; location: string };
  attendances: Array<{
    id: string;
    verified: boolean;
    verifiedAt?: string;
    cpdAwarded: number;
    distance?: number;
    session: { id: string; title: string; startTime: string };
  }>;
  paymentRequests: Array<{
    id: string;
    operationNumber?: string;
    amount: number;
    status: string;
    adminNote?: string;
    paymentMethod: { name: string };
    receiptImage?: string;
  }>;
}

export function ParticipantsManager() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/participants");
      if (!res.ok) { setParticipants([]); return; }
      const text = await res.text();
      const data = text ? JSON.parse(text) : { participants: [] };
      setParticipants(data.participants || []);
    } catch (e) {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  const totalCpd = participants.reduce((sum, p) =>
    sum + p.attendances.filter(a => a.verified).reduce((s, a) => s + a.cpdAwarded, 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-600" />
          المسجلون والحضور
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          عرض جميع المسجلين وحالة الدفع والحضور ونقاط CPD
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-2 border-emerald-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">إجمالي المسجلين</p>
                <p className="text-2xl font-bold">{participants.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-200 shadow-modern">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">مدفوع</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {participants.filter(p => p.paymentStatus === "approved").length}
                </p>
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
                <p className="text-xs text-muted-foreground mb-1">بانتظار الموافقة</p>
                <p className="text-2xl font-bold text-amber-600">
                  {participants.filter(p => p.paymentStatus === "awaiting_approval").length}
                </p>
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
                <p className="text-xs text-muted-foreground mb-1">نقاط CPD الممنوحة</p>
                <p className="text-2xl font-bold text-emerald-600">{totalCpd.toFixed(1)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card className="shadow-modern">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Users className="h-4 w-4" />
            </div>
            قائمة المسجلين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">لا يوجد مسجلون حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم الوطني</TableHead>
                    <TableHead>الصفة</TableHead>
                    <TableHead>النشاط</TableHead>
                    <TableHead>الدفع</TableHead>
                    <TableHead>الحضور</TableHead>
                    <TableHead>نقاط CPD</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => {
                    const verifiedCount = p.attendances.filter(a => a.verified).length;
                    const participantCpd = p.attendances.filter(a => a.verified).reduce((s, a) => s + a.cpdAwarded, 0);
                    return (
                      <TableRow key={p.id} className="hover:bg-emerald-50/30">
                        <TableCell className="font-medium">{p.fullName}</TableCell>
                        <TableCell className="text-xs font-mono ltr-text" dir="ltr">{p.nationalId}</TableCell>
                        <TableCell>{p.role === "practitioner" ? "ممارس" : "مقيم"}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{p.activity?.title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            p.paymentStatus === "approved" ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                            p.paymentStatus === "awaiting_approval" ? "bg-amber-50 border-amber-300 text-amber-700" :
                            p.paymentStatus === "rejected" ? "bg-rose-50 border-rose-300 text-rose-700" :
                            "bg-gray-50 border-gray-300 text-gray-700"
                          }>
                            {p.paymentStatus === "approved" ? "مدفوع" :
                             p.paymentStatus === "awaiting_approval" ? "بانتظار الموافقة" :
                             p.paymentStatus === "rejected" ? "مرفوض" :
                             p.paymentStatus === "skipped" ? "بدون دفع" : "معلق"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {verifiedCount}/{p.attendances.length} جلسة
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-emerald-600">{participantCpd.toFixed(1)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedParticipant(p)}>
                            تفاصيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participant Details Dialog */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">تفاصيل المسجل</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParticipant(null)}>×</Button>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">الاسم</p>
                <p className="font-semibold">{selectedParticipant.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الرقم الوطني</p>
                <p className="font-mono ltr-text" dir="ltr">{selectedParticipant.nationalId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الصفة</p>
                <p>{selectedParticipant.role === "practitioner" ? "ممارس" : "مقيم"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">النشاط</p>
                <p className="font-semibold text-sm">{selectedParticipant.activity?.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">حالة الدفع</p>
                <Badge variant="outline" className={
                  selectedParticipant.paymentStatus === "approved" ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                  "bg-amber-50 border-amber-300 text-amber-700"
                }>
                  {selectedParticipant.paymentStatus === "approved" ? "مدفوع" : "بانتظار الموافقة"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">رقم المرجع</p>
                <p className="font-mono text-xs ltr-text" dir="ltr">{selectedParticipant.paymentRef || "—"}</p>
              </div>
            </div>

            {/* Payment Requests */}
            {selectedParticipant.paymentRequests.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">طلبات الدفع</h4>
                <div className="space-y-2">
                  {selectedParticipant.paymentRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-xl border bg-muted/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الطريقة: {req.paymentMethod.name}</span>
                        <span className="font-semibold">{req.amount.toLocaleString("ar-EG")} ل.س</span>
                      </div>
                      {req.operationNumber && (
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-muted-foreground">رقم العملية:</span>
                          <span className="font-mono ltr-text" dir="ltr">{req.operationNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">الحالة:</span>
                        <Badge variant="outline" className={
                          req.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          req.status === "rejected" ? "bg-rose-50 text-rose-700" :
                          "bg-amber-50 text-amber-700"
                        }>
                          {req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                        </Badge>
                      </div>
                      {req.receiptImage && (
                        <div className="mt-2">
                          <img src={req.receiptImage} alt="إيصال" className="max-h-32 rounded-lg border" />
                        </div>
                      )}
                      {req.adminNote && (
                        <p className="text-xs text-muted-foreground mt-1">ملاحظة: {req.adminNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance */}
            <div>
              <h4 className="font-semibold text-sm mb-2">سجلات الحضور</h4>
              {selectedParticipant.attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد سجلات حضور</p>
              ) : (
                <div className="space-y-2">
                  {selectedParticipant.attendances.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                      {att.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{att.session?.title}</p>
                        {att.verified && att.verifiedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(att.verifiedAt).toLocaleString("ar-EG")}
                          </p>
                        )}
                        {att.distance !== undefined && att.distance !== null && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            المسافة: {Math.round(att.distance)} متر
                          </p>
                        )}
                      </div>
                      {att.verified && (
                        <Badge className="bg-emerald-600 text-white">
                          <Award className="h-3 w-3 ml-1" />
                          {att.cpdAwarded.toFixed(1)} نقطة
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
