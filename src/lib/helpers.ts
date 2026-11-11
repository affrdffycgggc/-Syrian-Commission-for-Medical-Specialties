// Helper utilities for the activity management system

// Calculate distance between two GPS coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Format date in Arabic
export function formatArabicDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

export function formatArabicDateTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
}

export function formatTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleTimeString();
  }
}

// Activity type display names (Arabic)
export const ACTIVITY_TYPES = [
  { value: "conference", label: "مؤتمر", color: "emerald" },
  { value: "scientific_day", label: "يوم علمي", color: "teal" },
  { value: "discussion_session", label: "جلسة حوارية", color: "cyan" },
  { value: "workshop", label: "ورشة عمل", color: "amber" },
  { value: "seminar", label: "ندوة", color: "rose" },
] as const;

export function getActivityTypeLabel(type: string): string {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getActivityTypeColor(type: string): string {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.color ?? "emerald";
}

// Payment methods
export const PAYMENT_METHODS = [
  { value: "cash", label: "نقداً في الموقع", icon: "💰", color: "emerald" },
  { value: "card", label: "بطاقة بنكية", icon: "💳", color: "blue" },
  { value: "transfer", label: "تحويل بنكي", icon: "🏦", color: "purple" },
  { value: "syriatel", label: "سيرياتيل كاش", icon: "📱", color: "amber" },
] as const;

// Check if current time is within activity time window
export function isWithinTimeWindow(
  startTime: Date,
  endTime: Date,
  bufferMinutes: number = 30
): { active: boolean; message: string } {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const buffer = bufferMinutes * 60 * 1000;

  if (now < new Date(start.getTime() - buffer)) {
    const diff = start.getTime() - now.getTime();
    return {
      active: false,
      message: `يبدأ التسجيل خلال ${formatCountdown(diff)}`,
    };
  }
  if (now > new Date(end.getTime() + buffer)) {
    return {
      active: false,
      message: "انتهت الفترة الزمنية المحددة",
    };
  }
  return { active: true, message: "ضمن الفترة الزمنية المحددة" };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "الآن";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} يوم و${hours % 24} ساعة`;
  if (hours > 0) return `${hours} ساعة و${minutes % 60} دقيقة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return `${seconds} ثانية`;
}

// Generate payment reference
export function generatePaymentRef(): string {
  const date = new Date();
  const timestamp = date.getTime().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `PAY-${timestamp}${random}`;
}
