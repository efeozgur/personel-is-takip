"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  _count: { processes: number };
}

interface Process {
  id: string;
  title: string;
  description: string | null;
  category: { id: string; name: string; icon: string | null };
  author: { id: string; name: string };
  tags: { tag: { id: string; name: string } }[];
  _count: { steps: number };
  createdAt: string;
}

const categoryIcons: Record<string, string> = {
  "Gelen Evrak": "📨",
  "Giden Evrak": "📤",
  "Arşiv": "🗄️",
  "Tarama": "🖨️",
  "Dilekçe": "📝",
};

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentProcesses, setRecentProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, procRes] = await Promise.all([
          fetch("/api/kategoriler"),
          fetch("/api/is-akislari"),
        ]);
        const categoriesData = await catRes.json();
        const processesData = await procRes.json();
        setCategories(categoriesData);
        setRecentProcesses(processesData.slice(0, 6));
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/is-akislari?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl w-full">
          <div className="mb-10">
            <div className="w-14 h-14 mx-auto mb-8 rounded-2xl bg-zinc-900 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 mb-5">
              Personel İş Akışı
            </h1>
            <p className="text-lg text-zinc-600 mb-10 leading-relaxed max-w-xl mx-auto">
              İş akışlarını adım adım öğrenin, bilgi paylaşımında bulunun
              ve kurumunuzdaki süreçleri daha verimli hale getirin.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/giris" className="btn-primary px-6 py-3 text-base">
              Giriş Yap
            </Link>
            <Link href="/kayit" className="btn-secondary px-6 py-3 text-base">
              Kayıt Ol
            </Link>
          </div>
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="card p-6 text-center">
              <div className="text-2xl mb-3">📋</div>
              <p className="text-sm font-medium text-zinc-900">Adım Adım Rehberler</p>
              <p className="text-xs text-zinc-500 mt-1">Detaylı yönergeler</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl mb-3">🖼️</div>
              <p className="text-sm font-medium text-zinc-900">Görsel Anlatım</p>
              <p className="text-xs text-zinc-500 mt-1">Ekran görüntüleri ile</p>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl mb-3">🔍</div>
              <p className="text-sm font-medium text-zinc-900">Kolay Arama</p>
              <p className="text-xs text-zinc-500 mt-1">Hızlı erişim</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Hoş Geldiniz, {session.user.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            İş akışlarını keşfedin ve bilgi paylaşımında bulunun
          </p>
        </div>
        <Link href="/is-akislari/ekle" className="btn-primary text-sm hidden sm:inline-flex">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni İş Akışı
        </Link>
      </div>

      {/* Arama */}
      <form onSubmit={handleSearch} className="mb-12">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İş akışlarında ara..."
            className="input w-full pl-11 pr-28 h-12"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-sm px-4 py-1.5">
            Ara
          </button>
        </div>
      </form>

      {/* Kategoriler */}
      {categories.length > 0 && (
        <div className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-zinc-900">Kategoriler</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/is-akislari?kategori=${category.id}`}
                className="card-hover p-5 text-left"
              >
                <div className="text-2xl mb-3">
                  {category.icon || categoryIcons[category.name] || "📁"}
                </div>
                <h3 className="font-medium text-zinc-900 text-sm mb-0.5">
                  {category.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  {category._count.processes} iş akışı
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Son Eklenen İş Akışları */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">Son Eklenen</h2>
          <Link
            href="/is-akislari"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1"
          >
            Tümünü Gör
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentProcesses.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-zinc-900 font-medium mb-1">Henüz iş akışı bulunmuyor</p>
            <p className="text-sm text-zinc-500 mb-6">İlk iş akışını oluşturarak başlayın</p>
            <Link href="/is-akislari/ekle" className="btn-primary inline-flex">
              İlk İş Akışını Oluştur
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProcesses.map((process) => (
              <Link
                key={process.id}
                href={`/is-akislari/${process.id}`}
                className="card-hover p-5 group block"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-indigo">
                    {process.category.icon || "📁"} {process.category.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {process._count.steps} adım
                  </span>
                </div>
                <h3 className="font-medium text-zinc-900 mb-1.5 group-hover:text-zinc-700 line-clamp-2 leading-snug">
                  {process.title}
                </h3>
                {process.description && (
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                    {process.description}
                  </p>
                )}
                {process.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {process.tags.slice(0, 2).map((pt) => (
                      <span key={pt.tag.id} className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                        #{pt.tag.name}
                      </span>
                    ))}
                    {process.tags.length > 2 && (
                      <span className="text-xs text-zinc-400">+{process.tags.length - 2}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[10px] font-medium">
                      {process.author.name.charAt(0)}
                    </div>
                    <span className="text-xs text-zinc-600">{process.author.name}</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(process.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
