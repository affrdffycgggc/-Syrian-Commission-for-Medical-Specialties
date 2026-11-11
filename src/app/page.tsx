"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ActivityNotifications as NotificationManager } from "@/components/NotificationManager";
import { MaintenanceChecker } from "@/components/MaintenanceMode";
import { ActivitiesListView } from "@/components/views/ActivitiesListView";
import { ActivityDetailView } from "@/components/views/ActivityDetailView";
import { PaymentView } from "@/components/views/PaymentView";
import { AttendanceView } from "@/components/views/AttendanceView";

export default function Home() {
  const { currentView } = useAppStore();

  // Auto-seed admin on first load
  useEffect(() => {
    fetch("/api/seed").catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LoadingScreen />
      <MaintenanceChecker>
        <Header />
        <main className="flex-1">
          <div key={currentView} className="page-transition animate-page-enter-3d">
            {currentView === "home" && <ActivitiesListView />}
            {currentView === "activity_detail" && <ActivityDetailView />}
            {currentView === "payment" && <PaymentView />}
            {currentView === "attendance" && <AttendanceView />}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white py-10 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold leading-tight">نظام نشاطات والمؤتمرات</h3>
              </div>
              <div className="w-full max-w-md flex items-center gap-2 opacity-60">
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-400 to-transparent"></div>
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-slow"></div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-400 to-transparent"></div>
              </div>
              <p className="text-xs text-emerald-200/60 text-center">
                © 2026 نظام نشاطات والمؤتمرات — جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </footer>
      </MaintenanceChecker>
      <InstallPrompt />
      <NotificationManager />
    </div>
  );
}
