"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { AdminLoginView } from "@/components/views/AdminLoginView";
import { AdminDashboardView } from "@/components/views/AdminDashboardView";
import { AdminHeader } from "@/components/AdminHeader";
import { ShieldCheck } from "lucide-react";

export default function AdminPage() {
  const { admin, setAdmin } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Auto-seed admin first, then verify
    fetch("/api/seed")
      .then(() => fetch("/api/admin/verify"))
      .then(async (r) => {
        if (!r.ok) return null;
        const text = await r.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data?.authenticated) {
          setAdmin(data.admin);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [setAdmin]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 animate-fadeInScale">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-amber-300/30" style={{ width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`, left: `${(i * 7) % 100}%`, top: `${(i * 5) % 100}%`, animation: `float ${2 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full border-2 border-dashed border-amber-400/30 animate-loading-ring"></div>
            <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/30 animate-loading-ring" style={{ animationDuration: "2s", animationDirection: "reverse" }}></div>
            <div className="absolute inset-0 bg-amber-400/40 blur-3xl rounded-full scale-150 animate-pulse-slow"></div>
            <div className="relative bg-white rounded-2xl p-3 shadow-2xl border-2 border-amber-400/40 overflow-hidden">
              <img src="/logo-original.jpg" alt="شعار الهيئة السورية للاختصاصات الطبية" className="h-24 w-24 object-contain animate-loading-logo" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-semibold mb-2">جاري التحقق من الصلاحيات</p>
            <div className="flex items-center justify-center gap-1">
              {[0, 1, 2].map((i) => (<span key={i} className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-slow" style={{ animationDelay: `${i * 0.2}s` }} />))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/40">
      <AdminHeader />
      <main className="flex-1">
        {admin ? <AdminDashboardView /> : <AdminLoginView />}
      </main>
      <footer className="mt-auto bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white py-6 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <p className="text-xs text-emerald-100/80">لوحة تحكم النظام — مساحة إدارية آمنة</p>
          </div>
          <p className="text-xs text-emerald-200/50">© 2026 نظام نشاطات والمؤتمرات</p>
        </div>
      </footer>
    </div>
  );
}
