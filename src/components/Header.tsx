"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Menu,
  X,
  CheckCircle2,
  XCircle,
  Info,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const { currentView, setView, toast } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goHome = () => {
    setView("home");
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* STICKY TOP: Logo corner + nav - stays at top when scrolling */}
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
            <button
              onClick={goHome}
              className="flex items-center gap-3 group transition-all"
            >
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden bg-white shadow-lg group-hover:scale-105 transition-all">
                <img
                  src="/logo-original.jpg"
                  alt="شعار الهيئة السورية للاختصاصات الطبية"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-right">
                <h1 className="text-base md:text-lg font-bold leading-tight tracking-tight bg-gradient-to-l from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  نظام نشاطات والمؤتمرات
                </h1>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={currentView === "home" ? "default" : "ghost"}
                onClick={goHome}
                size="sm"
                className={`h-10 px-4 rounded-xl font-medium ${
                  currentView === "home"
                    ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-emerald"
                    : "hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <CalendarDays className="h-4 w-4 ml-2" />
                النشاطات
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/doctor"}
                size="sm"
                className="h-10 px-4 rounded-xl font-medium hover:bg-emerald-50 hover:text-emerald-700"
              >
                <User className="h-4 w-4 ml-2" />
                بوابة الطبيب
              </Button>
            </nav>

            {/* Mobile menu button */}
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
              variant={currentView === "home" ? "default" : "ghost"}
              onClick={goHome}
              className="justify-start h-11 rounded-xl"
            >
              <CalendarDays className="h-4 w-4 ml-2" />
              النشاطات
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = "/doctor"}
              className="justify-start h-11 rounded-xl"
            >
              <User className="h-4 w-4 ml-2" />
              بوابة الطبيب
            </Button>
          </nav>
        )}
      </div>

      {/* NON-STICKY EAGLE BANNER: scrolls away with the page (does NOT stay fixed) */}
      <div className="relative w-full overflow-hidden shadow-lg bg-emerald-950 animate-eagle-pulse">
        <img
          src="/eagle-banner-full.png"
          alt="شعار النسر السوري"
          className="w-full h-auto block object-contain"
          style={{ maxHeight: "160px" }}
        />
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-l from-emerald-950/10 via-transparent to-emerald-950/10 pointer-events-none"></div>
        {/* Soft glow pulse overlay */}
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
