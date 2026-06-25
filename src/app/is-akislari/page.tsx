"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

interface Category {
  id: string;
  name: string;
  icon: string | null;
  _count: { processes: number };
}

function IsAkislariContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("kategori") || ""
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [selectedCategory]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/kategoriler");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    }
  }

  async function fetchProcesses() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (search) params.set("search", search);
      const res = await fetch(`/api/is-akislari?${params}`);
      const data = await res.json();
      setProcesses(data);
    } catch (error) {
      console.error("İş akışları yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProcesses();
  };

  if (!session) {
    router.push("/giris");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          İş Akışları
        </h1>
        <Link href={`/is-akislari/ekle${selectedCategory ? `?kategori=${selectedCategory}` : ""}`} className="btn-primary inline-flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni İş Akışı
        </Link>
      </div>

      {/* Filtreler */}
      <div className="glass-card p-4 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[280px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İş akışı ara..."
              className="glass-input w-full pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input sm:w-56"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon || ""} {cat.name} ({cat._count.processes})
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-sm px-6">
            Ara
          </button>
        </form>
      </div>

      {/* Sonuçlar */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        </div>
      ) : processes.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400 text-lg mb-2">İş akışı bulunamadı</p>
          <p className="text-gray-300 text-sm">Farklı bir arama terimi deneyin veya yeni bir iş akışı oluşturun</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{processes.length} iş akışı bulundu</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processes.map((process, i) => (
              <Link
                key={process.id}
                href={`/is-akislari/${process.id}`}
                className="glass-card p-6 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-indigo text-[11px]">
                    {process.category.icon || "📁"} {process.category.name}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {process._count.steps} adım
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {process.title}
                </h3>
                {process.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{process.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {process.tags.slice(0, 3).map((pt) => (
                    <span key={pt.tag.id} className="badge bg-gray-100 text-gray-600 text-[10px]">
                      #{pt.tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[10px] font-medium">
                      {process.author.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-400">{process.author.name}</span>
                  </div>
                  <span className="text-xs text-gray-300">
                    {new Date(process.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function IsAkislariPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    }>
      <IsAkislariContent />
    </Suspense>
  );
}