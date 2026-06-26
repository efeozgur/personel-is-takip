"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SifremiUnuttumPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/sifremi-unuttum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }

      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
        if (data.expiresAt) setExpiresAt(data.expiresAt);
      } else {
        // Kullanıcı yok ama enumeration'ı önlemek için başarı mesajı göster.
        setError(
          "Bu e-posta ile kayıtlı bir hesap bulunamadı. Adresi kontrol edip tekrar deneyin."
        );
      }
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
    } catch {
      /* clipboard erişimi başarısız olursa kullanıcı linki seçerek kopyalar */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-zinc-900 flex items-center justify-center">
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Şifrenizi mi unuttunuz?
          </h2>
          <p className="text-sm text-zinc-500 mt-1.5">
            E-posta adresinizi girin, sıfırlama bağlantısı oluşturalım.
          </p>
        </div>

        <div className="card p-6">
          {!resetUrl ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-900 mb-1.5"
                >
                  E-posta
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Oluştur"}
              </button>

              <div className="pt-4 border-t border-zinc-100 text-center">
                <Link
                  href="/giris"
                  className="text-sm text-zinc-900 hover:underline font-medium"
                >
                  ← Giriş sayfasına dön
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-lg text-sm">
                Sıfırlama bağlantısı oluşturuldu. Aşağıdaki bağlantıya tıklayarak
                yeni şifre belirleyebilirsiniz.
                {expiresAt && (
                  <span className="block mt-1 text-emerald-700">
                    Bağlantının geçerlilik süresi:{" "}
                    {new Date(expiresAt).toLocaleString("tr-TR")}
                  </span>
                )}
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono break-all text-zinc-700">
                {resetUrl}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="btn-secondary text-sm flex-1"
                >
                  Kopyala
                </button>
                <button
                  type="button"
                  onClick={() => router.push(resetUrl)}
                  className="btn-primary text-sm flex-1"
                >
                  Hemen Git
                </button>
              </div>

              <p className="text-xs text-zinc-500 text-center pt-2">
                Üretim ortamında bu bağlantı e-posta ile gönderilir. Demo
                ortamında doğrudan burada görüntüleniyor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}