"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundBlobs from "@/components/ui/BackgroundBlobs";

export default function SifreSifirlaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }

      setSuccess(true);
      // 2 saniye sonra giriş sayfasına yönlendir
      setTimeout(() => router.push("/giris"), 2000);
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-transparent overflow-hidden">
      <BackgroundBlobs />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl gradient-box flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-navy-950 tracking-tight">
            Yeni Şifre Belirle
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Hesabınız için yeni bir şifre oluşturun.
          </p>
        </div>

        <div className="glass-card p-6">
          {success ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-lg text-sm">
                Şifreniz başarıyla güncellendi. Giriş sayfasına
                yönlendiriliyorsunuz…
              </div>
              <Link
                href="/giris"
                className="btn-primary text-sm w-full block text-center"
              >
                Hemen Giriş Yap
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-navy-950 mb-1.5"
                >
                  Yeni Şifre
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  En az 8 karakter.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium text-navy-950 mb-1.5"
                >
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </button>

              <div className="pt-4 border-t border-navy-100/70 text-center">
                <Link
                  href="/giris"
                  className="text-sm text-orange-600 hover:text-orange-700 hover:underline font-medium"
                >
                  ← Giriş sayfasına dön
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
