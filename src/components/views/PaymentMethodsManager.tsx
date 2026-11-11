"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  QrCode,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  qrCode?: string | null;
  walletCode?: string | null;
  walletName?: string | null;
  instructions?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export function PaymentMethodsManager() {
  const { showToast } = useAppStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-methods?includeInactive=true");
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      setMethods(data.methods || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف طريقة الدفع هذه؟")) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        showToast(data.message || "تم الحذف بنجاح", "success");
        loadMethods();
      } else {
        showToast(data.error || "فشل الحذف", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingMethod(null);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingMethod(null);
    loadMethods();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-600" />
            طرق الدفع
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة طرق الدفع المتاحة للمستخدمين — اسم الطريقة، صورة، QR اختياري، رقم المحفظة
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine">
          <Plus className="h-4 w-4 ml-2" />
          إضافة طريقة دفع
        </Button>
      </div>

      <Card className="shadow-modern">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-2xl">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">لا توجد طرق دفع بعد</p>
              <p className="text-xs mt-1">أضف طريقة دفع جديدة لتبدأ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {methods.map((method) => (
                <div key={method.id} className={`p-4 rounded-xl border-2 transition-all ${
                  method.isActive
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-muted bg-muted/20 opacity-60"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-emerald-200 flex-shrink-0 overflow-hidden">
                      {method.image ? (
                        <img src={method.image} alt={method.name} className="h-12 w-12 object-contain" />
                      ) : (
                        <Wallet className="h-7 w-7 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight">{method.name}</h3>
                        <Badge variant={method.isActive ? "default" : "secondary"} className={method.isActive ? "bg-emerald-600" : ""}>
                          {method.isActive ? "نشطة" : "معطّلة"}
                        </Badge>
                      </div>
                      {method.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{method.description}</p>
                      )}
                      {method.walletCode && (
                        <p className="text-xs text-emerald-700 font-mono ltr-text" dir="ltr">{method.walletCode}</p>
                      )}
                      {method.qrCode && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <QrCode className="h-3 w-3" />
                          يحتوي على رمز QR
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 pt-3 border-t border-dashed">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(method)} className="text-blue-600 hover:bg-blue-50">
                      <Pencil className="h-3.5 w-3.5 ml-1" />
                      تعديل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(method.id)} className="text-rose-600 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <PaymentMethodFormDialog
          method={editingMethod}
          onClose={() => { setShowForm(false); setEditingMethod(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function PaymentMethodFormDialog({
  method,
  onClose,
  onSaved,
}: {
  method: PaymentMethod | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: method?.name || "",
    description: method?.description || "",
    walletCode: method?.walletCode || "",
    walletName: method?.walletName || "",
    instructions: method?.instructions || "",
    displayOrder: method?.displayOrder?.toString() || "0",
    isActive: method?.isActive ?? true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(method?.image || null);
  const [qrPreview, setQrPreview] = useState<string | null>(method?.qrCode || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setQrPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      showToast("يرجى إدخال اسم الطريقة", "error");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description);
      formData.append("walletCode", form.walletCode);
      formData.append("walletName", form.walletName);
      formData.append("instructions", form.instructions);
      formData.append("displayOrder", form.displayOrder);
      formData.append("isActive", form.isActive.toString());

      if (imageFile) formData.append("image", imageFile);
      if (qrFile) formData.append("qrCode", qrFile);

      const url = method ? `/api/payment-methods/${method.id}` : "/api/payment-methods";
      const res = await fetch(url, {
        method: method ? "PUT" : "POST",
        body: formData,
      });
      const text = await res.text(); const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "فشل في الحفظ", "error");
        return;
      }
      showToast(method ? "تم تحديث طريقة الدفع" : "تم إضافة طريقة الدفع", "success");
      onSaved();
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            {method ? "تعديل طريقة الدفع" : "إضافة طريقة دفع جديدة"}
          </DialogTitle>
          <DialogDescription>
            أدخل تفاصيل طريقة الدفع. يمكن للمستخدمين رؤية هذه الطريقة عند الدفع
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">اسم الطريقة *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: محفظة سيرياتيل كاش"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">الوصف (اختياري)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف موجز لطريقة الدفع"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">كود المحفظة / رقم الحساب</Label>
              <Input
                value={form.walletCode}
                onChange={(e) => setForm({ ...form, walletCode: e.target.value })}
                placeholder="09XXXXXXXX أو IBAN"
                dir="ltr"
                className="ltr-text text-left"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم صاحب الحساب</Label>
              <Input
                value={form.walletName}
                onChange={(e) => setForm({ ...form, walletName: e.target.value })}
                placeholder="الهيئة السورية للاختصاصات الطبية"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">تعليمات الدفع (اختياري)</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="تعليمات تفصيلية لكيفية الدفع عبر هذه الطريقة"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4" />
              صورة الطريقة (شعار)
            </Label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden bg-emerald-50/30 flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="معاينة" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (يفضل 200x200)</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <QrCode className="h-4 w-4" />
              رمز QR (اختياري)
            </Label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-blue-300 flex items-center justify-center overflow-hidden bg-blue-50/30 flex-shrink-0">
                {qrPreview ? (
                  <img src={qrPreview} alt="QR" className="h-full w-full object-contain" />
                ) : (
                  <QrCode className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">يمكن للمستخدم مسح هذا الرمز للدفع</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">ترتيب العرض</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                dir="ltr"
                className="ltr-text text-left"
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">طريقة نشطة</p>
                <p className="text-xs text-muted-foreground">إذا لم تُفعّل، لن تظهر للمستخدمين</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
