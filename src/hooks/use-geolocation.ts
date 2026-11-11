"use client";

import { useState, useCallback, useEffect } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    supported:
      typeof navigator !== "undefined" && "geolocation" in navigator,
  });

  const getLocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        reject(new Error("المتصفح لا يدعم تحديد الموقع الجغرافي"));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setState({
            latitude,
            longitude,
            accuracy,
            loading: false,
            error: null,
            supported: true,
          });
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          let errorMessage = "فشل في تحديد الموقع";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "تم رفض الإذن بالوصول إلى الموقع. يجب السماح بالوصول للموقع لتأكيد الحضور";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "الموقع غير متاح حالياً";
              break;
            case error.TIMEOUT:
              errorMessage = "انتهت المهلة المحددة لتحديد الموقع";
              break;
          }
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, getLocation, clearError };
}

// Calculate distance between user location and target
export function useDistanceCheck() {
  const [distance, setDistance] = useState<number | null>(null);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
    return R * c;
  };

  const check = useCallback(
    (userLat: number, userLon: number, targetLat: number, targetLon: number) => {
      const d = calculateDistance(userLat, userLon, targetLat, targetLon);
      setDistance(d);
      return d;
    },
    []
  );

  return { distance, check, calculateDistance };
}

// Time-based check hook - returns whether current time is within window
export function useTimeCheck(
  startTime: string | null,
  endTime: string | null,
  bufferMinutes: number = 30
) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!startTime || !endTime) {
    return {
      active: false,
      message: "لا توجد فترة زمنية محددة",
      now,
      startsIn: null,
      endsIn: null,
    };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const buffer = bufferMinutes * 60 * 1000;
  const bufferStart = new Date(start.getTime() - buffer);
  const bufferEnd = new Date(end.getTime() + buffer);

  if (now < bufferStart) {
    const diff = start.getTime() - now.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    let msg = "يبدأ خلال ";
    if (days > 0) msg += `${days} يوم و`;
    if (hours > 0) msg += `${hours} ساعة و`;
    msg += `${minutes} دقيقة`;
    return {
      active: false,
      message: msg,
      now,
      startsIn: diff,
      endsIn: null,
    };
  }

  if (now > bufferEnd) {
    return {
      active: false,
      message: "انتهت الفترة الزمنية المحددة",
      now,
      startsIn: null,
      endsIn: null,
    };
  }

  return {
    active: true,
    message: "ضمن الفترة الزمنية المحددة",
    now,
    startsIn: null,
    endsIn: null,
  };
}
