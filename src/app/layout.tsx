import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "نظام نشاطات والمؤتمرات",
  description: "منصة نشاطات والمؤتمرات مع نظام نقاط CPD والتحقق من الحضور بالموقع الجغرافي",
  keywords: ["نشاطات", "مؤتمرات", "CPD", "حضور", "نقاط"],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-original.jpg",
    shortcut: "/logo-original.jpg",
    apple: "/logo-original.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "النشاطات",
  },
};

export const viewport: Viewport = {
  themeColor: "#065f46",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Use Google Fonts via CDN link (no build-time SWC issues) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased bg-background text-foreground"
        style={{ fontFamily: "'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif" }}
      >
        {children}
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
