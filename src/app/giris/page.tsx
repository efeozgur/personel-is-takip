"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundBlobs from "@/components/ui/BackgroundBlobs";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setError("Hesabınız henüz onaylanmamıştır. Lütfen admin tarafından onaylanmayı bekleyin.");
        } else {
          setError("Email veya şifre hatalı.");
        }
      } else {
        router.push("/");
        router.refresh();
      }
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
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl accent-box flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-orange-300 tracking-tight">Hesabınıza giriş yapın</h2>
          <p className="text-sm text-slate-400 mt-1.5">Personel İş Akışı platformuna hoş geldiniz</p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-400/30 text-rose-200 px-3.5 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="ornek@kurum.gov.tr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-2">
            <p className="text-sm text-slate-300">
              Hesabınız yok mu?{" "}
              <Link href="/kayit" className="text-orange-300 hover:text-orange-300 hover:underline font-medium">
                Kayıt olun
              </Link>
            </p>
            <p className="text-sm text-slate-300">
              <Link
                href="/sifremi-unuttum"
                className="text-orange-300 hover:text-orange-300 hover:underline font-medium"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
