"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import RatingStars from "@/components/RatingStars";

interface ImageType { id: string; url: string; alt: string | null; order: number; }
interface Step { id: string; order: number; title: string; description: string | null; images: ImageType[]; }
interface ProcessDetail {
  id: string; title: string; description: string | null;
  category: { id: string; name: string; icon: string | null };
  author: { id: string; name: string };
  steps: Step[]; tags: { tag: { id: string; name: string } }[];
  createdAt: string;
  ratingCount: number;
  ratingAverage: number;
  myRating: number | null;
}

export default function IsAkisiDetayPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [deleting, setDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isAuthor = !!(session && process && session.user.id === process.author.id);
  const canEdit = session && (session.user.role === "ADMIN" || process?.author.id === session.user.id);
  const canRate = !!(
    session &&
    session.user.role !== "PENDING" &&
    process &&
    session.user.id !== process.author.id
  );

  useEffect(() => { fetchProcess(); }, []);

  async function fetchProcess() {
    try {
      const res = await fetch(`/api/is-akislari/${params.id}`);
      if (!res.ok) { if (res.status === 404) router.push("/is-akislari"); return; }
      setProcess(await res.json());
    } catch (error) { console.error("İş akışı yüklenirken hata:", error); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Bu iş akışını silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/is-akislari/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/is-akislari"); else alert("Silme işlemi başarısız.");
    } catch { alert("Bir hata oluştu."); }
    finally { setDeleting(false); }
  }

  async function handleRate(score: number) {
    const res = await fetch(`/api/is-akislari/${params.id}/puanla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Puan kaydedilemedi.");
      return;
    }
    fetchProcess();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="glass-card p-12 text-center max-w-md mx-auto mt-20">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-400">İş akışı bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span className="badge-indigo text-[11px]">{process.category.icon || "📁"} {process.category.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[8px]">{process.author.name.charAt(0)}</div>
                {process.author.name}
              </span>
              <span>•</span>
              <span>{new Date(process.createdAt).toLocaleDateString("tr-TR")}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{process.title}</h1>
            {process.description && <p className="mt-2 text-gray-500">{process.description}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {process.tags.map((pt) => (
                <span key={pt.tag.id} className="badge bg-indigo-50 text-indigo-600 text-[10px]">#{pt.tag.name}</span>
              ))}
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Link href={`/is-akislari/${process.id}/duzenle`} className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Düzenle
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger text-sm py-1.5 px-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {deleting ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Topluluk Puanı */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">Topluluk Puanı</h3>
            <RatingStars
              value={process.ratingAverage}
              count={process.ratingCount}
              size="md"
            />
          </div>
          {canRate && (
            <div className="flex flex-col items-start sm:items-end">
              <RatingStars
                interactive
                value={process.myRating ?? 0}
                onRate={handleRate}
                size="md"
              />
              <p className="text-xs text-zinc-400 mt-2">
                {process.myRating
                  ? `Puanınız: ${process.myRating} ★ (güncellemek için tıklayın)`
                  : "Puan vermek için tıklayın"}
              </p>
            </div>
          )}
          {!canRate && !isAuthor && session && (
            <p className="text-xs text-zinc-400">
              Puan vermek için ADMIN veya USER rolünde olmalısınız.
            </p>
          )}
          {isAuthor && (
            <p className="text-xs text-zinc-400">
              Kendi iş akışınızı puanlayamazsınız.
            </p>
          )}
        </div>
      </div>

      {/* Adım Sayısı */}
      <div className="flex items-center gap-2 mb-4">
        <span className="badge bg-gray-100 text-gray-500 text-xs">{process.steps.length} adım</span>
      </div>

      {/* Adımlar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card p-4 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Adımlar
            </h3>
            <div className="space-y-1">
              {process.steps.map((step, index) => (
                <button key={step.id} onClick={() => setActiveStep(index)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    activeStep === index
                      ? "bg-indigo-50 text-indigo-700 font-medium shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  <span className="text-xs text-gray-400 mr-2">{step.order}.</span>
                  {step.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aktif Adım */}
        <div className="flex-1">
          {process.steps.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400">Henüz adım eklenmemiş.</p>
            </div>
          ) : (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <span className="step-indicator">{process.steps[activeStep].order}</span>
                  {process.steps[activeStep].title}
                </h2>
                <div className="flex gap-2 text-sm">
                  {activeStep > 0 && (
                    <button onClick={() => setActiveStep(activeStep - 1)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Önceki
                    </button>
                  )}
                  {activeStep < process.steps.length - 1 && (
                    <button onClick={() => setActiveStep(activeStep + 1)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                      Sonraki
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {process.steps[activeStep].description && (
                <DescriptionWithTags text={process.steps[activeStep].description} />
              )}

              {process.steps[activeStep].images.length > 0 && (
                <div className="space-y-4">
                  {process.steps[activeStep].images.sort((a, b) => a.order - b.order).map((image) => (
                    <div
                      key={image.id}
                      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-zoom-in"
                      onClick={() => setLightboxImage(image.url)}
                    >
                      <Image src={image.url} alt={image.alt || "Ekran görüntüsü"} width={800} height={600} className="w-full h-auto object-contain" />
                      {image.alt && <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50">{image.alt}</p>}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

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
              alt="Büyük görüntü"
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

function DescriptionWithTags({ text }: { text: string }) {
  const parts: (string | { tag: string })[] = [];
  const regex = /#([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    parts.push({ tag: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));

  return (
    <div className="text-gray-700 mb-6 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 leading-relaxed">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <Link
            key={i}
            href={`/is-akislari?tagId=&search=%23${encodeURIComponent(p.tag)}`}
            className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors"
          >
            #{p.tag}
          </Link>
        )
      )}
    </div>
  );
}
