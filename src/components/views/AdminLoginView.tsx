"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  Loader2,
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  Settings,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

export function AdminLoginView() {
  const { setAdmin, showToast } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error || "فشل في تسجيل الدخول");
        return;
      }
      setAdmin(data.admin);
      showToast("تم تسجيل الدخول بنجاح", "success");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      setError("حدث خطأ. حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border-2 border-emerald-200 shadow-modern-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-t-lg pb-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-amber-400/40 blur-xl rounded-full scale-150"></div>
              <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-3 border-2 border-amber-400/40 shadow-xl overflow-hidden">
                <img
                  src="/logo-original.jpg"
                  alt="شعار الهيئة السورية للاختصاصات الطبية"
                  className="h-20 w-20 object-contain animate-float"
                />
              </div>
            </div>
            <CardTitle className="text-2xl flex items-center gap-2 text-white">
              <LayoutDashboard className="h-6 w-6" />
              لوحة تحكم النظام
            </CardTitle>
            <p className="text-white/80 text-sm mt-2">
              تسجيل الدخول للوصول إلى لوحة التحكم
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="activities-system@gmail.com"
                className="ltr-text text-left h-11"
                dir="ltr"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ltr-text text-left h-11 pl-11"
                  dir="ltr"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600 p-1.5 rounded-lg transition-colors"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/50 text-rose-800 text-sm flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full h-12 text-base font-bold bg-gradient-to-l from-emerald-600 to-teal-600 text-white hover:opacity-90 btn-shine"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 ml-2" />
                  دخول لوحة التحكم
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            نظام نشاطات والمؤتمرات
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Settings View - for changing credentials
export function AdminSettingsView() {
  const { showToast } = useAppStore();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail,
          currentPassword,
          newEmail,
          newName,
          newPassword,
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        showToast(data.error || "فشل في التحديث", "error");
        return;
      }
      showToast("تم تحديث بيانات الدخول بنجاح", "success");
      setCurrentEmail("");
      setCurrentPassword("");
      setNewEmail("");
      setNewName("");
      setNewPassword("");
    } catch (e) {
      showToast("حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-emerald-200 shadow-modern max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-600" />
          إعدادات الحساب
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangeCredentials} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              البريد الحالي (للتحقق)
            </Label>
            <Input
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              className="ltr-text text-left"
              dir="ltr"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              كلمة المرور الحالية (للتحقق)
            </Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="ltr-text text-left"
              dir="ltr"
              required
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">البيانات الجديدة:</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  الاسم الجديد (اختياري)
                </Label>
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على الحالي"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  البريد الجديد (اختياري)
                </Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على الحالي"
                  className="ltr-text text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4" />
                  كلمة المرور الجديدة (اختياري)
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="اتركها فارغة للإبقاء على الحالية"
                  className="ltr-text text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 ml-2" />
            )}
            حفظ التغييرات
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
