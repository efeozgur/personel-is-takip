interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-zinc-200 border-t-indigo-600 animate-spin ${className}`}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}
