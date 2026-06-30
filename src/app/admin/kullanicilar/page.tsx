"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

interface User {
  id: string; name: string; email: string;
  role: "ADMIN" | "USER" | "PENDING"; createdAt: string;
}

export default function AdminKullanicilarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.push("/");
    if (session) fetchUsers();
  }, [session]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/kullanicilar");
      if (res.ok) setUsers(await res.json());
    } catch (error) { console.error("Kullanıcılar yüklenirken hata:", error); }
    finally { setLoading(false); }
  }

  async function updateRole(userId: string, newRole: string) {
    try {
      const res = await fetch("/api/admin/kullanicilar", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) fetchUsers();
      else { const data = await res.json(); alert(data.error || "Güncelleme başarısız."); }
    } catch { alert("Bir hata oluştu."); }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch("/api/admin/kullanicilar", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) fetchUsers();
      else { const data = await res.json(); alert(data.error || "Silme başarısız."); }
    } catch { alert("Bir hata oluştu."); }
  }

  async function resetPassword(userId: string, userEmail: string) {
    const newPassword = window.prompt(
      `${userEmail} için yeni şifre (en az 8 karakter):`
    );
    if (!newPassword) return;
    if (newPassword.length < 8) {
      alert("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (!confirm(`${userEmail} kullanıcısının şifresi değiştirilecek. Devam edilsin mi?`)) return;
    try {
      const res = await fetch(`/api/admin/kullanicilar/${userId}/sifre-sifirla`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Şifre güncellendi.");
      } else {
        alert(data.error || "Şifre sıfırlama başarısız.");
      }
    } catch { alert("Bir hata oluştu."); }
  }

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  function openEdit(user: User) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditError("");
  }

  function closeEdit() {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditError("");
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setEditError("İsim en az 2 karakter olmalıdır.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEditError("Geçerli bir e-posta girin.");
      return;
    }

    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(
        `/api/admin/kullanicilar/${editingUser.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Güncelleme başarısız.");
        return;
      }
      await fetchUsers();
      closeEdit();
    } catch {
      setEditError("Bir hata oluştu.");
    } finally {
      setEditLoading(false);
    }
  }

  // Modal açıkken ESC ile kapatma
  useEffect(() => {
    if (!editingUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingUser]);

  if (!session || session.user.role !== "ADMIN") return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return "badge-admin";
      case "USER": return "badge-green";
      case "PENDING": return "badge-yellow";
      default: return "";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Admin";
      case "USER": return "Kullanıcı";
      case "PENDING": return "Onay Bekliyor";
      default: return role;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl gradient-box flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        Kullanıcı Yönetimi
      </h1>

      <div className="card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ad Soyad</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kayıt</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-orange-500/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-box flex items-center justify-center text-white text-xs font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`${getRoleBadge(user.role)} text-[11px]`}>{getRoleLabel(user.role)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select value={user.role} onChange={(e) => updateRole(user.id, e.target.value)}
                        className="text-xs border border-white/10 rounded-lg px-2.5 py-1.5 bg-white/5 focus:ring-1 focus:ring-orange-500/40 focus:border-transparent">
                        <option value="PENDING">Onay Bekliyor</option>
                        <option value="USER">Kullanıcı</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => openEdit(user)}
                        title="Düzenle"
                        className="p-1.5 text-slate-500 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => resetPassword(user.id, user.email)}
                        title="Şifre Sıfırla"
                        className="p-1.5 text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteUser(user.id)}
                        title="Kullanıcıyı Sil"
                        className="p-1.5 text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors">
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

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/10">
          {users.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-box flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span className={`ml-auto ${getRoleBadge(user.role)} text-[11px]`}>{getRoleLabel(user.role)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString("tr-TR")}</span>
                <div className="flex items-center gap-2">
                  <select value={user.role} onChange={(e) => updateRole(user.id, e.target.value)}
                    className="text-xs border border-white/10 rounded-lg px-2 py-1 bg-white/5">
                    <option value="PENDING">Onay Bekliyor</option>
                    <option value="USER">Kullanıcı</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    onClick={() => openEdit(user)}
                    title="Düzenle"
                    className="p-1.5 text-slate-500 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => resetPassword(user.id, user.email)}
                    title="Şifre Sıfırla"
                    className="p-1.5 text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </button>
                  <button onClick={() => deleteUser(user.id)}
                    title="Kullanıcıyı Sil"
                    className="p-1.5 text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {users.length === 0 && (
          <div className="p-12">
            <EmptyState icon="👥" title="Henüz kayıtlı kullanıcı yok" />
          </div>
        )}
      </div>

      {editingUser && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeEdit}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="card w-full max-w-md p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-1">
              Kullanıcıyı Düzenle
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              ID: {editingUser.id}
            </p>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-400/30 text-rose-200 px-3.5 py-2.5 rounded-lg text-sm mb-4">
                {editError}
              </div>
            )}

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-white mb-1.5"
                >
                  Ad Soyad
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  minLength={2}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="edit-email"
                  className="block text-sm font-medium text-white mb-1.5"
                >
                  E-posta
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="btn-secondary text-sm flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary text-sm flex-1"
                >
                  {editLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
