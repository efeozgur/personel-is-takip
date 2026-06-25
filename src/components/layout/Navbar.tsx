"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/giris" || pathname === "/kayit") {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/is-akislari", label: "İş Akışları" },
    { href: "/is-akislari/ekle", label: "Yeni İş Akışı" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-zinc-900 hidden sm:block tracking-tight">
                Personel İş Akışı
              </span>
            </Link>

            {session && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {session.user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/admin/kategoriler"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/admin/kategoriler")
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      Kategoriler
                    </Link>
                    <Link
                      href="/admin/kullanicilar"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/admin/kullanicilar")
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      Kullanıcılar
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5 pl-3 pr-1 py-1">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-medium">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm leading-tight">
                    <p className="text-zinc-900 font-medium">
                      {session.user.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/giris" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </>
            ) : (
              <Link href="/giris" className="btn-primary text-sm px-4 py-1.5">
                Giriş Yap
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && session && (
          <div className="md:hidden pb-3 pt-2 border-t border-zinc-200 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {session.user.role === "ADMIN" && (
              <>
                <Link
                  href="/admin/kategoriler"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive("/admin/kategoriler")
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Kategoriler
                </Link>
                <Link
                  href="/admin/kullanicilar"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive("/admin/kullanicilar")
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Kullanıcılar
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
