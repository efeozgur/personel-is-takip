"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Spinner from "@/components/ui/Spinner";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Tag {
  id: string;
  name: string;
}

interface StepImage {
  id?: string;
  url: string;
  file?: File;
  preview?: string;
  isNew?: boolean;
  toDelete?: boolean;
}

interface StepData {
  id?: string;
  description: string;
  order: number;
  images: StepImage[];
  isNew?: boolean;
  toDelete?: boolean;
}

interface ProcessEditData {
  title: string;
  description: string | null;
  categoryId: string;
  author: { id: string };
  tags: { tag: { id: string } }[];
  steps: {
    id: string;
    description: string | null;
    order: number;
    images: { id: string; url: string }[];
  }[];
}

export default function DuzenlePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    async function load() {
      try {
        const [processRes, catRes, tagsRes] = await Promise.all([
          fetch(`/api/is-akislari/${params.id}`),
          fetch("/api/kategoriler"),
          fetch("/api/etiketler"),
        ]);
        if (!processRes.ok) { router.push("/is-akislari"); return; }
        const processData: ProcessEditData = await processRes.json();
        const catData: Category[] = await catRes.json();
        const tagsData: Tag[] = await tagsRes.json();
        if (session?.user.role !== "ADMIN" && processData.author.id !== session?.user.id) {
          router.push(`/is-akislari/${params.id}`); return;
        }
        setTitle(processData.title);
        setDescription(processData.description || "");
        setCategoryId(processData.categoryId);
        setCategories(catData);
        setTags(tagsData);
        setSelectedTags(processData.tags.map((pt) => pt.tag.id));
        setSteps(
          processData.steps.map((step) => ({
            id: step.id,
            description: step.description || "",
            order: step.order,
            images: step.images.map((img) => ({ id: img.id, url: img.url })),
            isNew: false,
            toDelete: false,
          }))
        );
      } catch (error) { console.error("Veri yüklenirken hata:", error); }
      finally { setLoading(false); }
    }
    load();
  }, [session]);

  const addStep = () => {
    const maxOrder = steps.length > 0 ? Math.max(...steps.filter(s => !s.toDelete).map(s => s.order)) : 0;
    setSteps([...steps, { description: "", order: maxOrder + 1, images: [], isNew: true, toDelete: false }]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    if (newSteps[index].isNew) {
      newSteps.splice(index, 1);
    } else {
      newSteps[index].toDelete = true;
    }
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof StepData, value: string | File[]) => {
    const newSteps = [...steps];
    if (field === "images" && Array.isArray(value)) {
      const newImages = (value as File[]).map((file) => ({
        url: URL.createObjectURL(file),
        preview: URL.createObjectURL(file),
        file,
        isNew: true,
      }));
      newSteps[index].images = [...newSteps[index].images, ...newImages];
    } else {
      newSteps[index].description = value as string;
    }
    setSteps(newSteps);
  };

  const removeImage = (stepIndex: number, imageIndex: number) => {
    const newSteps = [...steps];
    const img = newSteps[stepIndex].images[imageIndex];
    if (img.isNew) {
      if (img.preview) URL.revokeObjectURL(img.preview);
      newSteps[stepIndex].images.splice(imageIndex, 1);
    } else {
      img.toDelete = true;
    }
    setSteps(newSteps);
  };

  const handlePaste = (e: React.ClipboardEvent, stepIndex: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const blob = items[i].getAsFile();
        if (blob) {
          updateStep(stepIndex, "images", [blob]);
        }
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim()) { setError("Başlık zorunludur."); setSaving(false); return; }
    if (!categoryId) { setError("Kategori seçimi zorunludur."); setSaving(false); return; }

    // Adım açıklamalarından # ile başlayan etiketleri topla (X tarzı)
    const tagRegex = /#(\w+)/g;
    const inlineTags = new Set<string>();
    steps.forEach((s) => {
      if (s.toDelete || !s.description) return;
      const matches = s.description.match(tagRegex);
      if (matches) matches.forEach((m) => inlineTags.add(m.replace("#", "").toLowerCase()));
    });

    // Mevcut seçili etiket ID'lerini ad'a çevir + açıklamalardan gelenleri birleştir
    const tagNames = new Set<string>();
    tags.forEach((t) => { if (selectedTags.includes(t.id)) tagNames.add(t.name.toLowerCase()); });
    inlineTags.forEach((t) => tagNames.add(t));

    try {
      // Update process
      await fetch(`/api/is-akislari/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, categoryId, tags: Array.from(tagNames) }),
      });

      // Process steps
      for (const step of steps) {
        if (step.toDelete && step.id) {
          await fetch(`/api/adimlar/${step.id}`, { method: "DELETE" });
          continue;
        }

        let stepId = step.id;

        if (step.isNew) {
          // Create new step
          const res = await fetch(`/api/is-akislari/${params.id}/steps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: step.description, order: step.order }),
          });
          if (!res.ok) throw new Error("Adım oluşturulamadı.");
          const created = await res.json();
          stepId = created.id;
        } else if (step.id) {
          // Update existing step
          await fetch(`/api/adimlar/${step.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: step.description, order: step.order }),
          });
        }

        if (!stepId) continue;

        // Handle images
        for (const img of step.images) {
          if (img.toDelete && img.id) {
            await fetch("/api/gorseller", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: img.id }),
            });
          } else if (img.isNew && img.file) {
            const formData = new FormData();
            formData.append("file", img.file);
            formData.append("stepId", stepId);
            const uploadRes = await fetch("/api/yukleme", { method: "POST", body: formData });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              await fetch("/api/gorseller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepId, url: uploadData.url, alt: uploadData.alt, order: 0 }),
              });
            }
          }
        }
      }

      router.push(`/is-akislari/${params.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl gradient-box flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </span>
        İş Akışını Düzenle
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Temel Bilgiler */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs text-indigo-600 font-semibold">1</span>
            Temel Bilgiler
          </h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Başlık *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kategori *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input w-full" required>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Etiketler</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag.id} type="button" onClick={() => setSelectedTags((prev) => prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id])}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedTags.includes(tag.id) ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}>
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Adımlar */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs text-violet-600 font-semibold">2</span>
              Adımlar ({steps.filter(s => !s.toDelete).length})
            </h2>
            <button type="button" onClick={addStep} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Adım Ekle
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              !step.toDelete && (
              <div
                key={index}
                className={`border rounded-xl p-5 transition-all ${
                  step.isNew ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 bg-white"
                }`}
                onPaste={(e) => handlePaste(e, index)}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                    <span className="step-indicator text-xs">{step.order}</span>
                    Adım {step.order}
                    {step.isNew && <span className="text-xs text-emerald-600 font-normal ml-1">(Yeni)</span>}
                  </h3>
                  <button type="button" onClick={() => removeStep(index)} className="text-sm text-rose-500 hover:text-rose-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Kaldır
                  </button>
                </div>

                <div className="space-y-3">
                  <textarea value={step.description} onChange={(e) => updateStep(index, "description", e.target.value)} rows={3} className="input w-full" placeholder="Bu adımda ne yapılmalı? Detaylı açıklama, ipuçları..." required />

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ekran Görüntüleri</label>
                    <p className="text-xs text-zinc-400 mb-2">Dosya seçebilir veya Ctrl+V ile resim yapıştırabilirsiniz</p>
                    <input type="file" accept="image/*" multiple onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) updateStep(index, "images", files);
                    }} className="file-input" />

                    {step.images.filter(img => !img.toDelete).length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {step.images.map((img, imgIndex) => (
                          !img.toDelete && (
                          <div
                            key={imgIndex}
                            className={`relative group rounded-lg overflow-hidden border cursor-zoom-in shadow-sm ${
                              img.isNew ? "border-emerald-300" : "border-zinc-200"
                            }`}
                            onClick={() => setLightboxImage(img.preview || img.url)}
                          >
                            <Image
                              src={img.preview || img.url}
                              alt={`Önizleme ${imgIndex + 1}`}
                              width={200}
                              height={150}
                              className="w-full h-24 object-cover"
                              unoptimized={!!img.preview}
                            />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index, imgIndex); }}
                              className="absolute top-1 right-1 bg-rose-500/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              ×
                            </button>
                            {img.isNew && <span className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded">Yeni</span>}
                          </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            İptal
          </button>
          <button type="submit" disabled={saving} className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>Kaydediliyor...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Kaydet</>
            )}
          </button>
        </div>
      </form>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-4xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            ×
          </button>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxImage}
              alt="Büyük önizleme"
              width={1200}
              height={900}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
