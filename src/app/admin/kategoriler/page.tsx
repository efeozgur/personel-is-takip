"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
        <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Kategori Düzenle" : "Yeni Kategori"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">İkon (emoji)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="glass-input"
                  placeholder="📁"
                  maxLength={2}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori Adı *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass-input"
                  placeholder="Gelen Evrak"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="glass-input"
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
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">İkon</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">İş Akışı</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-2xl">{cat.icon || "📁"}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.description || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="badge-indigo text-[11px]">{cat._count.processes} adet</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
        <div className="md:hidden divide-y divide-gray-50">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon || "📁"}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat._count.processes} iş akışı</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(cat)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-rose-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-gray-400 mb-2">Henüz kategori eklenmemiş.</p>
            <button onClick={() => setIsAdding(true)} className="btn-primary text-sm mt-2">İlk Kategoriyi Ekle</button>
          </div>
        )}
      </div>
    </div>
  );
}