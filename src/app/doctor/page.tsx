"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DoctorPortalView } from "@/components/views/DoctorPortalView";

export default function DoctorPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    fetch("/api/seed").catch(() => {});
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <DoctorPortalView />
      </main>
      <footer className="mt-auto bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white py-6 px-4">
        <div className="container mx-auto text-center">
          <p className="text-xs text-emerald-200/60">© 2026 نظام نشاطات والمؤتمرات — بوابة الطبيب</p>
        </div>
      </footer>
    </div>
  );
}
