"use client";

import { useEffect, useState } from "react";
import { Loader2, Wrench, RefreshCcw } from "lucide-react";

export function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-amber-300/20" style={{ width: `${2 + (i % 4)}px`, height: `${2 + (i % 4)}px`, left: `${(i * 5) % 100}%`, top: `${(i * 7) % 100}%`, animation: `float ${2 + (i % 4)}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl animate-float"></div>
      <div className="relative z-10 max-w-md w-full">
        <div className="border-2 border-amber-400/40 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 p-8 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/30 blur-xl rounded-full scale-150 animate-pulse"></div>
              <div className="relative animate-spin-slow">
                <Wrench className="h-20 w-20 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mt-4">النظام قيد الصيانة</h1>
          </div>
          <div className="pt-6 pb-6 text-center px-6">
            <p className="text-muted-foreground leading-relaxed mb-4">
              نعمل حالياً على تحسين النظام لتقديم تجربة أفضل.<br />
              سنعود قريباً بإذن الله.
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-slow" style={{ animationDelay: "0s" }} />
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-slow" style={{ animationDelay: "0.2s" }} />
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-slow" style={{ animationDelay: "0.4s" }} />
            </div>
            <button onClick={() => window.location.reload()} className="w-full rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 px-4 py-2 text-sm font-semibold transition-all">
              <RefreshCcw className="h-4 w-4 inline ml-2" />
              إعادة المحاولة
            </button>
            <p className="text-xs text-muted-foreground mt-4">© 2026 نظام نشاطات والمؤتمرات</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MaintenanceChecker({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) {
          setChecking(false);
          return;
        }
        const text = await res.text();
        if (!text) {
          setChecking(false);
          return;
        }
        const data = JSON.parse(text);
        setMaintenance(data.maintenanceMode === true);
      } catch (e) {
        setMaintenance(false);
      } finally {
        setChecking(false);
      }
    };

    const timeout = setTimeout(() => setChecking(false), 3000);
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (maintenance) {
    const isAdminPage = typeof window !== "undefined" && window.location.pathname.startsWith("/activities-system");
    if (isAdminPage) return <>{children}</>;
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
