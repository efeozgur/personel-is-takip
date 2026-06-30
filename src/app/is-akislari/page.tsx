"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import RatingStars from "@/components/RatingStars";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

interface Process {
  id: string;
  title: string;
  description: string | null;
  category: { id: string; name: string; icon: string | null };
  author: { id: string; name: string };
  tags: { tag: { id: string; name: string } }[];
  steps: { images: { url: string }[] }[];
  _count: { steps: number };
  ratingCount: number;
  ratingAverage: number;
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
      if (!res.ok) {
        console.error("API error:", res.status, await res.text());
        setProcesses([]);
        return;
      }
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
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl gradient-box flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="card p-4 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[280px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İş akışı ara..."
              className="input w-full pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input sm:w-56"
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
          <Spinner size="lg" />
        </div>
      ) : processes.length === 0 ? (
        <div className="card p-16">
          <EmptyState
            icon="🔍"
            title="İş akışı bulunamadı"
            description="Farklı bir arama terimi deneyin veya yeni bir iş akışı oluşturun"
            action={
              <Link href="/is-akislari/ekle" className="btn-primary inline-flex">
                Yeni İş Akışı Oluştur
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-4">{processes.length} iş akışı bulundu</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processes.map((process, i) => {
              const thumb = process.steps[0]?.images[0]?.url ?? null;
              return (
                <Link
                  key={process.id}
                  href={`/is-akislari/${process.id}`}
                  className="card-hover group block overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {thumb ? (
                    <div className="relative h-36 w-full overflow-hidden bg-zinc-100">
                      <Image
                        src={thumb}
                        alt={process.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-36 w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-5xl">
                      {process.category.icon || "📁"}
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge-indigo text-[11px]">
                        {process.category.icon || "📁"} {process.category.name}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {process._count.steps} adım
                      </span>
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {process.title}
                    </h3>
                    {process.description && (
                      <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{process.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {process.tags.slice(0, 3).map((pt) => (
                        <span key={pt.tag.id} className="badge bg-indigo-50 text-indigo-600 text-[10px]">
                          #{pt.tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full gradient-box flex items-center justify-center text-white text-[10px] font-medium">
                            {process.author.name.charAt(0)}
                          </div>
                          <span className="text-xs text-zinc-500 truncate max-w-[80px]">{process.author.name}</span>
                        </div>
                        {process.ratingCount > 0 && (
                          <RatingStars
                            value={process.ratingAverage}
                            count={process.ratingCount}
                            size="sm"
                          />
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 flex-shrink-0">
                        {new Date(process.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
        <Spinner size="lg" />
      </div>
    }>
      <IsAkislariContent />
    </Suspense>
  );
}
