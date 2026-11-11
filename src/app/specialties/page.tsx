"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import {
  Stethoscope,
  Loader2,
  Search,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatArabicDate } from "@/lib/helpers";

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

interface Specialty {
  id: string;
  name: string;
  slice: string;
  sliceName: string;
  isActive: boolean;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  typeName: string;
  governorate?: string | null;
  location: string;
  startDate: string;
  endDate: string;
  hoursCount: number;
  cpdPoints: number;
  cpdPointsParticipation?: number;
  fee: number;
  residentFee: number;
  status: string;
  imageColor: string;
  featured: boolean;
  specialty?: { id: string; name: string; sliceName: string } | null;
  _count?: { participants: number };
}

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlice, setSelectedSlice] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [specRes, actRes] = await Promise.all([
        fetch("/api/specialties"),
        fetch("/api/activities"),
      ]);
      const specData = await specRes.json();
      const actData = await actRes.json();
      setSpecialties(specData.specialties || []);
      setActivities(actData.activities || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter specialties by slice
  const filteredSpecialties = selectedSlice === "all"
    ? specialties
    : specialties.filter((s) => s.slice === selectedSlice);

  // Filter activities by specialty
  const filteredActivities = activities.filter((a) => {
    if (!selectedSpecialty) return true;
    return a.specialty?.id === selectedSpecialty;
  }).filter((a) => {
    if (!search) return true;
    return a.title.includes(search) || a.location.includes(search);
  }).filter((a) => a.status === "active");

  // Group activities by slice
  const activitiesBySlice: Record<string, Activity[]> = {};
  filteredActivities.forEach((a) => {
    const slice = a.specialty?.slice || "other";
    if (!activitiesBySlice[slice]) activitiesBySlice[slice] = [];
    activitiesBySlice[slice].push(a);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald">
              <Stethoscope className="h-6 w-6" />
            </div>
            الاختصاصات الطبية
          </h1>
          <p className="text-muted-foreground">
            تصفح النشاطات والمؤتمرات حسب الشريحة والاختصاص
          </p>
        </div>

        {/* Slice filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => { setSelectedSlice("all"); setSelectedSpecialty(null); }}
            className={`px-4 h-10 rounded-xl text-sm font-medium transition-all ${
              selectedSlice === "all"
                ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white"
                : "bg-white hover:bg-emerald-50 text-muted-foreground border"
            }`}
          >
            كل الشرائح
          </button>
          {SLICES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setSelectedSlice(s.value); setSelectedSpecialty(null); }}
              className={`px-4 h-10 rounded-xl text-sm font-medium transition-all ${
                selectedSlice === s.value
                  ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white"
                  : "bg-white hover:bg-emerald-50 text-muted-foreground border"
              }`}
            >
              {s.label}
              <span className="text-xs mr-1 opacity-70">
                ({specialties.filter((sp) => sp.slice === s.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 relative max-w-md">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن نشاط..."
            className="pr-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Specialties sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-modern sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    {selectedSlice === "all"
                      ? "كل الاختصاصات"
                      : SLICES.find((s) => s.value === selectedSlice)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedSpecialty(null)}
                      className={`w-full text-right p-2.5 rounded-xl transition-all text-sm ${
                        !selectedSpecialty
                          ? "bg-emerald-100 text-emerald-700 font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      كل النشاطات ({activities.filter((a) => !selectedSlice || a.specialty?.slice === selectedSlice || selectedSlice === "all").length})
                    </button>
                    {filteredSpecialties.map((s) => {
                      const count = activities.filter((a) => a.specialty?.id === s.id && a.status === "active").length;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSpecialty(s.id)}
                          className={`w-full text-right p-2.5 rounded-xl transition-all text-sm flex justify-between items-center ${
                            selectedSpecialty === s.id
                              ? "bg-emerald-100 text-emerald-700 font-semibold"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span>{s.name}</span>
                          {count > 0 && (
                            <Badge variant="outline" className="text-xs">{count}</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activities */}
            <div className="lg:col-span-3">
              {filteredActivities.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">لا توجد نشاطات متاحة</p>
                    <p className="text-xs mt-1">حاول تغيير الفلتر أو البحث</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    عرض {filteredActivities.length} نشاط
                    {selectedSpecialty && (
                      <span> في اختصاص: <strong className="text-emerald-700">{filteredSpecialties.find((s) => s.id === selectedSpecialty)?.name}</strong></span>
                    )}
                  </p>
                  {filteredActivities.map((a) => (
                    <Card key={a.id} className="shadow-modern hover:shadow-modern-lg transition-all">
                      <CardContent className="pt-5">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                                {a.typeName || a.type}
                              </Badge>
                              {a.specialty && (
                                <Badge variant="outline" className="border-blue-300 text-blue-700">
                                  {a.specialty.sliceName} - {a.specialty.name}
                                </Badge>
                              )}
                              {a.featured && (
                                <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
                                  مميز
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-base mb-1">{a.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.description}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatArabicDate(a.startDate)}
                              </span>
                              {a.governorate && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {a.governorate}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {a.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {a.hoursCount} ساعة
                              </span>
                              <span className="text-emerald-700 font-semibold">
                                CPD حضور: {a.cpdPoints}
                              </span>
                              {a.cpdPointsParticipation && a.cpdPointsParticipation > 0 && (
                                <span className="text-sky-700 font-semibold">
                                  CPD مشاركة: {a.cpdPointsParticipation}
                                </span>
                              )}
                              <span className="text-amber-700 font-semibold">
                                {a.fee === 0 ? "مجاناً" : `${a.fee.toLocaleString("ar-EG")} ل.س`}
                              </span>
                              {a.residentFee > 0 && a.residentFee < a.fee && (
                                <span className="text-purple-700 font-semibold">
                                  رسوم المقيم: {a.residentFee.toLocaleString("ar-EG")} ل.س
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <footer className="mt-auto bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white py-6 px-4">
        <div className="container mx-auto text-center">
          <p className="text-xs text-emerald-200/60">© 2026 نظام نشاطات والمؤتمرات</p>
        </div>
      </footer>
    </div>
  );
}
