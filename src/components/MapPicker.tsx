"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Navigation, Crosshair, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// We'll build a custom map picker using Leaflet + OpenStreetMap (no API key needed)
// This is the free, no-API-key alternative to Google Maps
// We'll dynamically import Leaflet to avoid SSR issues

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  radius?: number;
  onChange: (lat: number, lng: number, locationName?: string) => void;
  initialLocationName?: string;
  height?: string;
}

export function MapPicker({
  latitude,
  longitude,
  radius = 100,
  onChange,
  initialLocationName = "",
  height = "320px",
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState(initialLocationName);
  const [searching, setSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>(
    latitude && longitude ? { lat: latitude, lng: longitude } : { lat: 33.5138, lng: 36.2765 }
  );

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    if (leafletLoadedRef.current) return;
    leafletLoadedRef.current = true;

    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[data-leaflet-css]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.setAttribute("data-leaflet-css", "true");
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Leaflet"));
            document.head.appendChild(script);
          });
        }

        const L = (window as any).L;
        if (!L) throw new Error("Leaflet not loaded");
        if (!mapContainerRef.current) return;

        // Initialize map
        const initialLat = latitude ?? 33.5138;
        const initialLng = longitude ?? 36.2765;
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Use OpenStreetMap tiles (public free service - not linked to any specific provider)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: 'OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        // Add marker
        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
        }).addTo(map);

        // Add radius circle
        const circle = L.circle([initialLat, initialLng], {
          color: "#10b981",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.15,
          radius: Math.max(20, radius),
        }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;

        // On marker drag end
        marker.on("dragend", () => {
          const latlng = marker.getLatLng();
          updateLocation(latlng.lat, latlng.lng);
        });

        // On map click
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          circle.setLatLng([lat, lng]);
          updateLocation(lat, lng);
        });

        setLoading(false);
      } catch (e: any) {
        setError(e.message || "فشل تحميل الخريطة");
        setLoading(false);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update location & reverse geocode using Nominatim (free)
  const updateLocation = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    if (circleRef.current && mapInstanceRef.current) {
      circleRef.current.setLatLng([lat, lng]);
    }
    onChange(lat, lng);

    // Reverse geocode (optional - works without it)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data.display_name) {
            setSearchQuery(data.display_name);
            onChange(lat, lng, data.display_name);
          }
        }
      }
    } catch (e) {
      // silent fail - map works without geocoding
    }
  };

  // Search location by name
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=ar`
      );
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([latNum, lngNum]);
          circleRef.current.setLatLng([latNum, lngNum]);
          mapInstanceRef.current.setView([latNum, lngNum], 15);
        }
        setSelectedCoords({ lat: latNum, lng: lngNum });
        onChange(latNum, lngNum, display_name);
      } else {
        setError("لم يتم العثور على الموقع");
      }
    } catch (e) {
      setError("فشل في البحث");
    } finally {
      setSearching(false);
    }
  };

  // Get user's current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (markerRef.current && mapInstanceRef.current && circleRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          circleRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        setSelectedCoords({ lat, lng });
        updateLocation(lat, lng);
        setSearching(false);
      },
      (err) => {
        setError("فشل في تحديد موقعك");
        setSearching(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search bar - div instead of form to avoid nested form hydration errors */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(e as any); } }}
            placeholder="ابحث عن عنوان أو مكان..."
            className="pr-10"
          />
        </div>
        <Button type="button" disabled={searching} variant="outline" onClick={handleSearch as any}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="mr-1">بحث</span>
        </Button>
        <Button type="button" onClick={handleUseMyLocation} disabled={searching} variant="outline">
          <Crosshair className="h-4 w-4" />
          <span className="mr-1">موقعي</span>
        </Button>
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="map-picker-container"
        style={{ height, width: "100%" }}
      />

      {/* Coordinates display */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {searchQuery && (
            <p className="text-sm font-medium truncate" title={searchQuery}>
              {searchQuery}
            </p>
          )}
          <p className="text-xs text-muted-foreground ltr-text" dir="ltr">
            خط العرض: {selectedCoords.lat.toFixed(6)} | خط الطول: {selectedCoords.lng.toFixed(6)}
          </p>
        </div>
        <div className="text-emerald-600">
          <Check className="h-5 w-5" />
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">{error}</p>
      )}

      <p className="text-xs text-muted-foreground flex items-start gap-1">
        <Navigation className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>اضغط على أي مكان في الخريطة لتحديد الموقع، أو اسحب العلامة لتعديلها. يتطلب السماح بالوصول للموقع لاستخدام زر "موقعي".</span>
      </p>
    </div>
  );
}
