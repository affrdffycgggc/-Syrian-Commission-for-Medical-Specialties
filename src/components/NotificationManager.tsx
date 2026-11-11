"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, Calendar, Clock, MapPin, Check } from "lucide-react";

interface ActivityReminder {
  id: string;
  title: string;
  location: string;
  startDate: string;
  daysLeft: number;
}

export function ActivityNotifications() {
  const { showToast } = useAppStore();
  const [permission, setPermission] = useState<string>("default");
  const [showBanner, setShowBanner] = useState(false);
  const [reminders, setReminders] = useState<ActivityReminder[]>([]);

  useEffect(() => {
    if ("Notification" in window) {
      requestAnimationFrame(() => {
        setPermission(Notification.permission);
        if (Notification.permission === "default") {
          setTimeout(() => setShowBanner(true), 3000);
        }
      });
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowBanner(false);
      if (result === "granted") {
        showToast("تم تفعيل الإشعارات بنجاح", "success");
        checkReminders();
      }
    }
  };

  const checkReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/activities");
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      const activities = data.activities || [];

      const now = new Date();
      const upcoming: ActivityReminder[] = [];

      for (const act of activities) {
        const start = new Date(act.startDate);
        const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Remind for activities 1, 3, 7 days before
        if (diffDays > 0 && diffDays <= 7) {
          upcoming.push({
            id: act.id,
            title: act.title,
            location: act.location,
            startDate: act.startDate,
            daysLeft: diffDays,
          });
        }
      }

      setReminders(upcoming);

      // Send browser notifications for upcoming activities
      if (permission === "granted" && upcoming.length > 0) {
        for (const rem of upcoming) {
          const timeText = rem.daysLeft === 1
            ? "غداً"
            : rem.daysLeft === 0
            ? "اليوم"
            : `بعد ${rem.daysLeft} أيام`;

          new Notification(`تذكير: ${rem.title}`, {
            body: `النشاط ${timeText} في ${rem.location}`,
            icon: "/logo-original.jpg",
            dir: "rtl",
            tag: `reminder-${rem.id}`,
            vibrate: [200, 100, 200],
          });
        }
      }
    } catch (e) {
      // silent
    }
  }, [permission]);

  // Check reminders every 5 minutes
  useEffect(() => {
    if (permission === "granted") {
      checkReminders();
      const interval = setInterval(checkReminders, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [permission, checkReminders]);

  if (!showBanner || permission !== "default") return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] animate-slideInRight">
      <Card className="border-2 border-emerald-300 shadow-modern-lg">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 text-right">
            <p className="font-bold text-sm">تفعيل الإشعارات</p>
            <p className="text-xs text-muted-foreground">احصل على تذكيرات قبل موعد النشاطات</p>
          </div>
          <Button
            size="sm"
            onClick={requestPermission}
            className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white flex-shrink-0"
          >
            <Check className="h-3.5 w-3.5 ml-1" />
            تفعيل
          </Button>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// Reminder banner shown on home page for registered users
export function ActivityReminderBanner() {
  const [reminders, setReminders] = useState<ActivityReminder[]>([]);

  useEffect(() => {
    const checkReminders = async () => {
      try {
        const res = await fetch("/api/activities");
        if (!res.ok) return;
        const text = await res.text();
        if (!text) return;
        const data = JSON.parse(text);
        const activities = data.activities || [];
        const now = new Date();
        const upcoming: ActivityReminder[] = [];

        for (const act of activities) {
          const start = new Date(act.startDate);
          const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) {
            upcoming.push({
              id: act.id,
              title: act.title,
              location: act.location,
              startDate: act.startDate,
              daysLeft: diffDays,
            });
          }
        }
        setReminders(upcoming);
      } catch (e) {}
    };
    checkReminders();
  }, []);

  if (reminders.length === 0) return null;

  return (
    <div className="container mx-auto px-4 mb-6">
      <div className="rounded-2xl bg-gradient-to-l from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-amber-600" />
          <h3 className="font-bold text-amber-800">تذكير بالنشاطات القادمة</h3>
        </div>
        <div className="space-y-2">
          {reminders.map((rem) => (
            <div key={rem.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/60 border border-amber-200">
              <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{rem.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {rem.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {rem.daysLeft === 0 ? "اليوم" : rem.daysLeft === 1 ? "غداً" : `بعد ${rem.daysLeft} أيام`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
