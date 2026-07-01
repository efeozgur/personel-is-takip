"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface StepForm {
  description: string;
  images: { file: File; preview: string }[];
}

interface DraftStep {
  description: string;
}

interface WorkflowDraft {
  title: string;
  description: string;
  categoryId: string;
  selectedTags: string[];
  steps: DraftStep[];
}

const WORKFLOW_DRAFT_KEY = "personel-is-akisi:create-draft";

function EkleForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(searchParams.get("kategori") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepForm[]>([
    { description: "", images: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const addStepButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showFloatingAddStep, setShowFloatingAddStep] = useState(false);
  const draftLoadedRef = useRef(false);

  useEffect(() => {
    async function loadOptions() {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/kategoriler"),
        fetch("/api/etiketler"),
      ]);

      setCategories(await categoriesRes.json());
      setTags(await tagsRes.json());
    }

    void loadOptions();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris");
    }
  }, [router, status]);

  useEffect(() => {
    if (!session) return;

    const button = addStepButtonRef.current;
    if (!button) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingAddStep(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(button);

    return () => observer.disconnect();
  }, [session]);

  useEffect(() => {
    const rawDraft = localStorage.getItem(WORKFLOW_DRAFT_KEY);
    if (!rawDraft) {
      draftLoadedRef.current = true;
      return;
    }

    void Promise.resolve().then(() => {
      try {
        const draft = JSON.parse(rawDraft) as Partial<WorkflowDraft>;
        if (typeof draft.title === "string") setTitle(draft.title);
        if (typeof draft.description === "string") setDescription(draft.description);
        if (typeof draft.categoryId === "string") setCategoryId(draft.categoryId);
        if (Array.isArray(draft.selectedTags)) {
          setSelectedTags(draft.selectedTags.filter((tag): tag is string => typeof tag === "string"));
        }
        if (Array.isArray(draft.steps) && draft.steps.length > 0) {
          setSteps(
            draft.steps.map((step) => ({
              description: typeof step.description === "string" ? step.description : "",
              images: [],
            }))
          );
        }
      } catch {
        localStorage.removeItem(WORKFLOW_DRAFT_KEY);
      } finally {
        draftLoadedRef.current = true;
      }
    });
  }, []);

  useEffect(() => {
    if (!draftLoadedRef.current) return;

    const draft: WorkflowDraft = {
      title,
      description,
      categoryId,
      selectedTags,
      steps: steps.map((step) => ({ description: step.description })),
    };

    const hasDraftContent =
      title.trim() ||
      description.trim() ||
      categoryId ||
      selectedTags.length > 0 ||
      steps.some((step) => step.description.trim() || step.images.length > 0);

    if (hasDraftContent) {
      localStorage.setItem(WORKFLOW_DRAFT_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(WORKFLOW_DRAFT_KEY);
    }
  }, [categoryId, description, selectedTags, steps, title]);

  const addStep = () => {
    setSteps((currentSteps) => [...currentSteps, { description: "", images: [] }]);
  };

  const removeStep = (index: number) => {
    setSteps((currentSteps) => {
      if (currentSteps.length === 1) return currentSteps;
      return currentSteps.filter((_, i) => i !== index);
    });
  };

  const updateStep = (index: number, field: keyof StepForm, value: string | File[]) => {
    setSteps((currentSteps) => {
      const newSteps = [...currentSteps];
      if (field === "images" && Array.isArray(value)) {
        const newImages = value.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));
        newSteps[index].images = [...newSteps[index].images, ...newImages];
      } else if (field === "description" && typeof value === "string") {
        newSteps[index].description = value;
      }
      return newSteps;
    });
  };

  const removeImage = (stepIndex: number, imageIndex: number) => {
    const newSteps = [...steps];
    URL.revokeObjectURL(newSteps[stepIndex].images[imageIndex].preview);
    newSteps[stepIndex].images = newSteps[stepIndex].images.filter((_, i) => i !== imageIndex);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim()) { setError("Başlık zorunludur."); setSaving(false); return; }
    if (!categoryId) { setError("Kategori seçimi zorunludur."); setSaving(false); return; }

    const validSteps = steps.filter((s) => s.description.trim());
    if (validSteps.length === 0) { setError("En az bir adım eklemelisiniz."); setSaving(false); return; }

    // Adım açıklamalarından # ile başlayan etiketleri topla (X tarzı)
    const tagRegex = /#(\w+)/g;
    const inlineTags = new Set<string>();
    validSteps.forEach((s) => {
      const matches = s.description.match(tagRegex);
      if (matches) matches.forEach((m) => inlineTags.add(m.replace("#", "").toLowerCase()));
    });

    // Mevcut seçili etiket ID'lerini ad'a çevir + açıklamalardan gelenleri birleştir
    const tagNames = new Set<string>();
    tags.forEach((t) => { if (selectedTags.includes(t.id)) tagNames.add(t.name.toLowerCase()); });
    inlineTags.forEach((t) => tagNames.add(t));

    try {
      const processRes = await fetch("/api/is-akislari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, categoryId, tags: Array.from(tagNames) }),
      });
      if (!processRes.ok) { const data = await processRes.json(); throw new Error(data.error || "İş akışı oluşturulamadı."); }
      const process = await processRes.json();

      for (let i = 0; i < validSteps.length; i++) {
        const step = validSteps[i];
        const stepRes = await fetch(`/api/is-akislari/${process.id}/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: step.description, order: i + 1 }),
        });
        if (!stepRes.ok) throw new Error(`Adım ${i + 1} oluşturulamadı.`);
        const createdStep = await stepRes.json();

        for (const image of step.images) {
          const formData = new FormData();
          formData.append("file", image.file);
          formData.append("stepId", createdStep.id);
          const uploadRes = await fetch("/api/yukleme", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            await fetch("/api/gorseller", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stepId: createdStep.id, url: uploadData.url, alt: uploadData.alt, order: 0 }),
            });
          }
        }
      }
      localStorage.removeItem(WORKFLOW_DRAFT_KEY);
      router.push(`/is-akislari/${process.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-orange-300 mb-8 flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl accent-box flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
        Yeni İş Akışı Oluştur
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200 text-sm rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Temel Bilgiler */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-orange-300 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-xs text-orange-300 font-semibold">1</span>
            Temel Bilgiler
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Başlık *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" placeholder="İş akışı başlığı" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input w-full" placeholder="Kısa bir açıklama" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Kategori *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input w-full" required>
                <option value="">Kategori seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon || "📁"} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Etiketler</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag.id} type="button" onClick={() => setSelectedTags((prev) => prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id])}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedTags.includes(tag.id) ? "bg-orange-500/10 border-orange-400/50 text-orange-300" : "bg-white/5 border-white/10 text-slate-300 hover:border-orange-400/60"
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
            <h2 className="text-lg font-semibold text-orange-300 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-xs text-orange-300 font-semibold">2</span>
              Adımlar
            </h2>
            <button ref={addStepButtonRef} type="button" onClick={addStep} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Adım Ekle
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-xl p-5 bg-white/5"
                onPaste={(e) => handlePaste(e, index)}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-orange-300 flex items-center gap-2">
                    <span className="step-indicator text-xs">{index + 1}</span>
                    Adım {index + 1}
                  </h3>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(index)} className="text-sm text-rose-500 hover:text-rose-300 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Kaldır
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <textarea value={step.description} onChange={(e) => updateStep(index, "description", e.target.value)} rows={3} className="input w-full" placeholder="Bu adımda ne yapılmalı? Detaylı açıklama, ipuçları..." required />

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1.5">Ekran Görüntüleri</label>
                    <p className="text-xs text-slate-500 mb-2">Dosya seçebilir veya Ctrl+V ile resim yapıştırabilirsiniz</p>
                    <input type="file" accept="image/*" multiple onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) updateStep(index, "images", files);
                    }} className="file-input" />

                    {step.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {step.images.map((img, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="relative group rounded-lg overflow-hidden border border-white/10 cursor-zoom-in shadow-sm"
                            onClick={() => setLightboxImage(img.preview)}
                          >
                            <Image src={img.preview} alt={`Önizleme ${imgIndex + 1}`} width={200} height={150} className="w-full h-24 object-cover" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index, imgIndex); }}
                              className="absolute top-1 right-1 bg-rose-500/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>Kaydediliyor...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>İş Akışını Oluştur</>
            )}
          </button>
        </div>
        </form>

      {showFloatingAddStep && (
        <button
          type="button"
          onClick={addStep}
          className="fixed bottom-6 right-6 z-40 btn-primary px-5 py-3 shadow-lg animate-fade-in-up md:right-8"
          aria-label="Yeni adım ekle"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adım Ekle
        </button>
      )}

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

export default function IsAkisiEklePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spinner size="lg" />
      </div>
    }>
      <EkleForm />
    </Suspense>
  );
}
