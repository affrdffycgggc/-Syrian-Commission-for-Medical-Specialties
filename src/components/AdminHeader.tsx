"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  X,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
} from "lucide-react";

export function AdminHeader() {
  const { admin, setAdmin, toast } = useAppStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAdmin(null);
    router.refresh();
  };

  const goToPublicSite = () => {
    window.open("/", "_blank");
  };

  return (
    <>
      {/* STICKY TOP: Logo corner + admin actions - stays at top when scrolling */}
      <div
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "glass shadow-modern border-b border-white/20"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Syrian Board logo in top-right corner */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden bg-white shadow-lg">
                <img
                  src="/logo-original.jpg"
                  alt="شعار الهيئة السورية للاختصاصات الطبية"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-right">
                <h1 className="text-base md:text-lg font-bold leading-tight tracking-tight bg-gradient-to-l from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  لوحة تحكم النظام
                </h1>
              </div>
            </div>

            {/* Desktop actions */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToPublicSite}
                size="sm"
                className="h-10 px-4 rounded-xl font-medium border-emerald-300 hover:bg-emerald-50"
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                عرض الموقع العام
              </Button>
              {admin && (
                <div className="flex items-center gap-2 mr-2 pl-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    {admin.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-emerald-700">{admin.name}</span>
                  <Button variant="ghost" onClick={handleLogout} size="sm" className="h-8 w-8 p-0">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </nav>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2.5 rounded-xl hover:bg-accent border border-border/40"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="القائمة"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-2 pb-4 pt-2 border-t bg-white/95">
            <Button
              variant="outline"
              onClick={goToPublicSite}
              className="justify-start h-11 rounded-xl"
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              عرض الموقع العام
            </Button>
            {admin && (
              <Button variant="ghost" onClick={handleLogout} className="justify-start h-11 rounded-xl text-rose-600">
                <LogOut className="h-4 w-4 ml-2" />
                خروج ({admin.name})
              </Button>
            )}
          </nav>
        )}
      </div>

      {/* NON-STICKY EAGLE BANNER: scrolls away with the page (does NOT stay fixed) */}
      <div className="relative w-full overflow-hidden shadow-lg bg-emerald-950 animate-eagle-pulse">
        <img
          src="/eagle-banner-full.png"
          alt="شعار النسر السوري"
          className="w-full h-auto block object-contain"
          style={{ maxHeight: "140px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-emerald-950/10 via-transparent to-emerald-950/10 pointer-events-none"></div>
        <div className="absolute inset-0 pointer-events-none animate-soft-glow"></div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md animate-slideInRight">
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-modern-lg backdrop-blur-md ${
              toast.type === "success"
                ? "border-emerald-500/40 bg-emerald-50/95 text-emerald-900"
                : toast.type === "error"
                ? "border-rose-500/40 bg-rose-50/95 text-rose-900"
                : "border-blue-500/40 bg-blue-50/95 text-blue-900"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white"
                  : toast.type === "error"
                  ? "bg-rose-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : toast.type === "error" ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed pt-1.5">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
}
