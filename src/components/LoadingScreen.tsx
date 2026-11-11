"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import type { ViewType } from "@/lib/types";

/**
 * LoadingScreen - شاشة تحميل متطورة وحديثة مع تأثيرات بصرية متقدمة
 * - خلفية ديناميكية مع موجات متحركة
 * - شعار مركزي مع حلقات دوارة وتوهج
 * - جسيمات عائمة
 * - شريط تقدم تفاعلي مع نسبة مئوية
 * - تأثيرات shimmer و glow
 * - نجوم متلألئة في الأطراف
 */
export function LoadingScreen() {
  const { currentView } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("جاري التحميل");
  const prevViewRef = useRef<ViewType | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadingTexts = [
    "جاري التحميل",
    "تجهيز البيانات",
    "تأكيد الاتصال",
    "التحقق من الصلاحيات",
    "تجهيز المحتوى",
  ];

  useEffect(() => {
    const prevView = prevViewRef.current;
    if (prevView !== null && prevView !== currentView) {
      requestAnimationFrame(() => {
        setIsLoading(true);
        setProgress(0);
        setLoadingText(loadingTexts[0]);

        let p = 0;
        let textIdx = 0;
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        progressTimerRef.current = setInterval(() => {
          p = Math.min(100, p + Math.random() * 20 + 5);
          setProgress(p);

          // Change loading text based on progress
          const newIdx = Math.min(loadingTexts.length - 1, Math.floor((p / 100) * loadingTexts.length));
          if (newIdx !== textIdx) {
            textIdx = newIdx;
            setLoadingText(loadingTexts[textIdx]);
          }

          if (p >= 100) {
            if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          }
        }, 80);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsLoading(false);
          setProgress(100);
        }, 1200);
      });
    }
    prevViewRef.current = currentView;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentView]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 backdrop-blur-xl animate-page-enter-3d">
      {/* ===== الطبقة 1: موجات ديناميكية ===== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl animate-float-slow" style={{ animationDuration: '8s' }}></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl animate-float-slow" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl animate-pulse-slow"></div>
        </div>
      </div>

      {/* ===== الطبقة 2: جسيمات عائمة ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const size = 1 + (i % 5);
          const colors = ["bg-amber-300/40", "bg-emerald-300/30", "bg-teal-300/25", "bg-white/20"];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              className={`absolute rounded-full ${color}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${(i * 2.5) % 100}%`,
                top: `${(i * 5.5) % 100}%`,
                animation: `float ${2 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${i * 0.08}s`,
                boxShadow: i % 3 === 0 ? `0 0 ${size * 2}px currentColor` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* ===== الطبقة 3: نجوم متلألئة ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute text-amber-300/60"
            style={{
              left: `${(i * 6.5) % 100}%`,
              top: `${(i * 11) % 100}%`,
              fontSize: `${8 + (i % 3) * 4}px`,
              animation: `pulse-slow ${1.5 + (i % 3) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* ===== الطبقة 4: حلقات دوارة في الخلفية ===== */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outermost ring */}
        <div
          className="w-[600px] h-[600px] rounded-full border-2 border-amber-400/8 animate-loading-ring"
          style={{ animationDuration: "40s" }}
        ></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[500px] h-[500px] rounded-full border-2 border-dashed border-emerald-400/10 animate-loading-ring"
          style={{ animationDuration: "30s", animationDirection: "reverse" }}
        ></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[400px] h-[400px] rounded-full border-2 border-teal-400/10 animate-loading-ring"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      {/* ===== الطبقة 5: المحتوى المركزي ===== */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Logo with rotating rings and glow */}
        <div className="relative">
          {/* Outer dashed ring */}
          <div className="absolute -inset-14 rounded-full border-2 border-dashed border-amber-400/40 animate-loading-ring"></div>
          {/* Middle ring with gradient border */}
          <div
            className="absolute -inset-10 rounded-full border-2 border-emerald-400/40 animate-loading-ring"
            style={{ animationDuration: "3s", animationDirection: "reverse" }}
          ></div>
          {/* Inner ring */}
          <div className="absolute -inset-6 rounded-full border border-teal-400/30 animate-loading-ring" style={{ animationDuration: "2s" }}></div>

          {/* Multi-layered glow */}
          <div className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full scale-150 animate-pulse-slow"></div>
          <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full scale-125 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

          {/* Logo container - Syrian Board logo */}
          <div className="relative bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-4 shadow-2xl overflow-hidden border-2 border-amber-400/40 animate-loading-logo">
            {/* Inner shimmer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer-slow"></div>
            <img
              src="/logo-original.jpg"
              alt="شعار الهيئة السورية للاختصاصات الطبية"
              className="relative h-32 w-32 md:h-44 md:w-44 object-contain"
            />
          </div>

          {/* Golden stars at corners with pulse */}
          <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-emerald-950 shadow-xl text-base font-bold animate-pulse-slow">
            ★
          </div>
          <div className="absolute -bottom-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-emerald-950 shadow-xl text-base font-bold animate-pulse-slow" style={{ animationDelay: '0.5s' }}>
            ★
          </div>

          {/* Top decorative dots */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-400"
                style={{
                  animation: `pulse-slow 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading text with shimmer effect */}
        <div className="text-center min-h-[60px] flex flex-col justify-center">
          <div className="relative overflow-hidden mb-2">
            <p className="text-white text-2xl font-bold tracking-wide" style={{ textShadow: '0 0 20px rgba(255, 215, 100, 0.3)' }}>
              {loadingText}
            </p>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
          <p className="text-emerald-200/50 text-sm tracking-widest">يرجى الانتظار...</p>
        </div>

        {/* Modern progress bar with percentage */}
        <div className="w-72 md:w-80 flex flex-col gap-2.5">
          <div className="flex justify-between text-xs text-emerald-200/80 font-mono tracking-wide">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              التقدم
            </span>
            <span className="text-amber-300 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-white/8 rounded-full overflow-hidden relative border border-white/10">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-amber-500/10"></div>
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-l from-amber-400 via-emerald-400 to-amber-400 rounded-full transition-all duration-200 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/50 to-transparent animate-shimmer"></div>
              {/* Glow at end of bar */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/40 blur-sm"></div>
            </div>
          </div>
        </div>

        {/* Loading dots with wave animation */}
        <div className="flex items-center gap-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="rounded-full bg-gradient-to-br from-amber-300 to-amber-500"
              style={{
                width: `${8 - i * 0.5}px`,
                height: `${8 - i * 0.5}px`,
                animation: `pulse-slow 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`,
                boxShadow: '0 0 8px rgba(255, 200, 100, 0.5)',
              }}
            />
          ))}
        </div>

        {/* Bottom decorative line */}
        <div className="flex items-center gap-2 opacity-50">
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400/40"></div>
          <span className="text-emerald-300/60 text-[10px] tracking-widest font-mono">SYRIAN BOARD OF MEDICAL SPECIALTIES</span>
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400/40"></div>
        </div>
      </div>

      {/* CSS Animations for shimmer-slow */}
      <style jsx>{`
        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
      `}</style>
    </div>
  );
}
