interface BackgroundBlobsProps {
  className?: string;
}

/**
 * Yumuşak gradient mesh arka plan — auth ve hero sayfaları için.
 * Sayfanın en altına, pointer-events-none olarak yerleşir.
 */
export default function BackgroundBlobs({
  className = "",
}: BackgroundBlobsProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-300/40 rounded-full blur-3xl animate-float" />
      <div
        className="absolute top-1/3 -right-24 w-96 h-96 bg-violet-300/40 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-96 h-96 bg-fuchsia-300/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
}
