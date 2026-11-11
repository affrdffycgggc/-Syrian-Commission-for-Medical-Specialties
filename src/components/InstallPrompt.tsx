"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      requestAnimationFrame(() => {
        setDeferredPrompt(e);
        setShowPrompt(true);
      });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slideInRight">
      <div className="glass border-2 border-emerald-300 shadow-modern-lg rounded-2xl p-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex-shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="flex-1 text-right">
          <p className="font-bold text-sm">تثبيت التطبيق</p>
          <p className="text-xs text-muted-foreground">ثبّت التطبيق على جهازك للوصول السريع</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          تثبيت
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2 rounded-xl hover:bg-muted text-muted-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function NotificationPermission() {
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) {
      requestAnimationFrame(() => {
        setPermission(Notification.permission);
      });
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  if (permission === "granted" || permission === "denied") return null;

  return (
    <button
      onClick={requestPermission}
      className="hidden"
      aria-hidden="true"
    />
  );
}
