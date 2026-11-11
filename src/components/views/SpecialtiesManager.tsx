"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Stethoscope,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const SLICES = [
  { value: "human_medicine", label: "طب بشري" },
  { value: "dentistry", label: "طب أسنان" },
  { value: "pharmacy", label: "صيدلة" },
  { value: "nursing", label: "تمريض" },
  { value: "lab", label: "علوم مختبرية" },
  { value: "veterinary", label: "طب بيطري" },
  { value: "engineering", label: "هندسة طبية حيوية" },
  { value: "other", label: "أخرى" },
];

const DEFAULT_SPECIALTIES = [
  // طب بشري
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض قلبية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض باطنية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض صدرية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جراحة عامة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جراحة عظمية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أطفال" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "نسائية وتوليد" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "عيون" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أنف وأذن وحنجرة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جلدية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "بولية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "عصبية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "نفسية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "تخدير" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "طوارئ" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أشعة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أمراض معدية" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "غدد صماء" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "جهاز هضمي" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "كلى" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "أورام" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "طب أسرة" },
  { slice: "human_medicine", sliceName: "طب بشري", name: "طب مجتمع" },
  // طب أسنان
  { slice: "dentistry", sliceName: "طب أسنان", name: "تقويم" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "علاج جذور" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "تركيبات" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "جراحة فم وأسنان" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "أطفال أسنان" },
  { slice: "dentistry", sliceName: "طب أسنان", name: "لثة" },
  // صيدلة
  { slice: "pharmacy", sliceName: "صيدلة", name: "صيدلة سريرية" },
  { slice: "pharmacy", sliceName: "صيدلة", name: "صيدلة صناعية" },
  { slice: "pharmacy", sliceName: "صيدلة", name: "عقاقير" },
  // تمريض
  { slice: "nursing", sliceName: "تمريض", name: "تمريض عام" },
  { slice: "nursing", sliceName: "تمريض", name: "تمريض رعاية مكثفة" },
  { slice: "nursing", sliceName: "تمريض", name: "تمريض أطفال" },
  // علوم مختبرية
  { slice: "lab", sliceName: "علوم مختبرية", name: "تحاليل طبية" },
  { slice: "lab", sliceName: "علوم مختبرية", name: "أحياء دقيقة" },
  { slice: "lab", sliceName: "علوم مختبرية", name: "كيمياء حيوية" },
];

interface Specialty {
  id: string;
  name: string;
  slice: string;
  sliceName: string;
  isActive: boolean;
}

export function SpecialtiesManager() {
  const { showToast } = useAppStore();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState({ name: "", slice: "human_medicine", sliceName: "طب بشري" });

  const loadSpecialties = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/specialties" : `/api/specialties?slice=${filter}`;
      const res = await fetch(url);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setSpecialties(data.specialties || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialties();
  }, [filter]);

  const handleSeedDefaults = async () => {
    if (!confirm("سيتم إنشاء ~40 اختصاص افتراضي في الشرائح المختلفة. متابعة؟")) return;
    try {
      const res = await fetch("/api/specialties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialties: DEFAULT_SPECIALTIES }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        showToast(`تم إنشاء ${data.created} اختصاص جديد`, "success");
        loadSpecialties();
      } else {
        showToast(data.error || "فشل", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleCreate = async () => {
    if (!newSpecialty.name || !newSpecialty.slice || !newSpecialty.sliceName) {
      showToast("يرجى تعبئة جميع الحقول", "error");
      return;
    }
    try {
      const res = await fetch("/api/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSpecialty),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        showToast("تم إضافة الاختصاص", "success");
        setNewSpecialty({ name: "", slice: filter === "all" ? "human_medicine" : filter, sliceName: SLICES.find((s) => s.value === (filter === "all" ? "human_medicine" : filter))?.label || "طب بشري" });
        loadSpecialties();
      } else {
        showToast(data.error || "فشل", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleUpdate = async (specialty: Specialty) => {
    try {
      const res = await fetch(`/api/specialties/${specialty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialty),
      });
      if (res.ok) {
        showToast("تم تحديث الاختصاص", "success");
        setEditing(null);
        loadSpecialties();
      } else {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        showToast(data.error || "فشل", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاختصاص؟")) return;
    try {
      const res = await fetch(`/api/specialties/${id}`, { method: "DELETE" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok) {
        showToast(data.softDelete ? data.message : "تم حذف الاختصاص", data.softDelete ? "info" : "success");
        loadSpecialties();
      } else {
        showToast(data.error || "فشل", "error");
      }
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  // Group specialties by slice
  const groupedSpecialties: Record<string, Specialty[]> = {};
  specialties.forEach((s) => {
    if (!groupedSpecialties[s.slice]) groupedSpecialties[s.slice] = [];
    groupedSpecialties[s.slice].push(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-emerald-600" />
            الاختصاصات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الاختصاصات الطبية مصنفة حسب الشريحة (طب بشري، أسنان، صيدلة...)
          </p>
        </div>
        <Button variant="outline" onClick={handleSeedDefaults}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء الاختصاصات الافتراضية
        </Button>
      </div>

      {/* Filter by slice */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 h-9 rounded-xl text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white"
              : "bg-white hover:bg-emerald-50 text-muted-foreground border"
          }`}
        >
          الكل
        </button>
        {SLICES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-4 h-9 rounded-xl text-sm font-medium transition-all ${
              filter === s.value
                ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white"
                : "bg-white hover:bg-emerald-50 text-muted-foreground border"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Create new */}
      <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30">
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-sm font-medium">اسم الاختصاص</Label>
              <Input
                value={newSpecialty.name}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
                placeholder="مثال: أمراض قلبية"
              />
            </div>
            <div className="md:w-60">
              <Label className="text-sm font-medium">الشريحة</Label>
              <Select
                value={newSpecialty.slice}
                onValueChange={(v) => {
                  const slice = SLICES.find((s) => s.value === v);
                  setNewSpecialty({ ...newSpecialty, slice: v, sliceName: slice?.label || v });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white btn-shine">
                <Plus className="h-4 w-4 ml-2" />
                إضافة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : specialties.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد اختصاصات بعد</p>
            <p className="text-xs mt-1">يمكنك إنشاء الاختصاصات الافتراضية أو إضافة اختصاص يدوياً</p>
          </CardContent>
        </Card>
      ) : filter === "all" ? (
        // Grouped view
        <div className="space-y-4">
          {Object.entries(groupedSpecialties).map(([slice, items]) => {
            const sliceInfo = SLICES.find((s) => s.value === slice);
            return (
              <Card key={slice} className="shadow-modern">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      {sliceInfo?.label || slice}
                    </span>
                    <Badge variant="outline">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map((s) => (
                      <SpecialtyItem
                        key={s.id}
                        specialty={s}
                        onEdit={() => setEditing(s)}
                        onDelete={() => handleDelete(s.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Flat view (filtered)
        <Card className="shadow-modern">
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {specialties.map((s) => (
                <SpecialtyItem
                  key={s.id}
                  specialty={s}
                  onEdit={() => setEditing(s)}
                  onDelete={() => handleDelete(s.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editing && (
        <EditSpecialtyDialog
          specialty={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

function SpecialtyItem({
  specialty,
  onEdit,
  onDelete,
}: {
  specialty: Specialty;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${
      specialty.isActive ? "border-emerald-200 bg-white" : "border-muted bg-muted/30 opacity-60"
    }`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-1">{specialty.name}</p>
        <p className="text-xs text-muted-foreground">{specialty.sliceName}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 text-blue-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
        </Button>
      </div>
    </div>
  );
}

function EditSpecialtyDialog({
  specialty,
  onClose,
  onSave,
}: {
  specialty: Specialty;
  onClose: () => void;
  onSave: (s: Specialty) => void;
}) {
  const [form, setForm] = useState<Specialty>(specialty);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-bold">تعديل الاختصاص</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <Label className="text-sm font-medium">الاسم</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm font-medium">الشريحة</Label>
            <Select
              value={form.slice}
              onValueChange={(v) => {
                const slice = SLICES.find((s) => s.value === v);
                setForm({ ...form, slice: v, sliceName: slice?.label || v });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLICES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
            <button
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.isActive ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
            <div>
              <p className="text-sm font-medium flex items-center gap-1">
                {form.isActive ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    مفعّل
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    معطّل
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">عند التعطيل، لا يظهر في قوائم الاختصاصات</p>
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => onSave(form)} className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white">
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
}
