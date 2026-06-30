interface BackgroundBlobsProps {
  className?: string;
}

/**
 * Koyu tema için düz, geçişsiz arka plan katmanı.
 */
export default function BackgroundBlobs({
  className = "",
}: BackgroundBlobsProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
