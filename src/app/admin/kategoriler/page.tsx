"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  _count: { processes: number };
  createdAt: string;
}

export default function AdminKategorilerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.push("/");
    if (session) fetchCategories();
  }, [session]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/kategoriler");
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      if (editingId) {
        await fetch("/api/kategoriler", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        });
      } else {
        await fetch("/api/kategoriler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setForm({ name: "", description: "", icon: "" });
      setEditingId(null);
      setIsAdding(false);
      fetchCategories();
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch("/api/kategoriler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchCategories();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "" });
    setIsAdding(true);
  }

  if (!session || session.user.role !== "ADMIN") return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl gradient-box flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </span>
          Kategori Yönetimi
        </h1>
        <button
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); setForm({ name: "", description: "", icon: "" }); }}
          className="btn-primary text-sm"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Kategori
        </button>
      </div>

      {/* Ekleme / Düzenleme Formu */}
      {isAdding && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            {editingId ? "Kategori Düzenle" : "Yeni Kategori"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">İkon (emoji)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="input"
                  placeholder="📁"
                  maxLength={2}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kategori Adı *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Gelen Evrak"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                placeholder="Kategori açıklaması"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="btn-secondary text-sm">
                İptal
              </button>
              <button type="submit" className="btn-primary text-sm">
                {editingId ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kategori Listesi */}
      <div className="card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">İkon</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">İş Akışı</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-6 py-4 text-2xl">{cat.icon || "📁"}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-zinc-900">{cat.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{cat.description || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="badge-indigo text-[11px]">{cat._count.processes} adet</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(cat)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-zinc-50">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon || "📁"}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{cat.name}</p>
                  <p className="text-xs text-zinc-400">{cat._count.processes} iş akışı</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(cat)} className="p-2 text-zinc-400 hover:text-indigo-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="p-12">
            <EmptyState
              icon="🏷️"
              title="Henüz kategori eklenmemiş"
              action={
                <button onClick={() => setIsAdding(true)} className="btn-primary text-sm mt-2">İlk Kategoriyi Ekle</button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
