"use client";

import { useState } from "react";

interface RatingStarsProps {
  value: number; // 0-5 arası (0 = boş)
  count?: number; // puanlayan kişi sayısı
  interactive?: boolean;
  onRate?: (score: number) => Promise<void> | void;
  size?: "sm" | "md";
  disabled?: boolean;
  disabledTitle?: string;
}

export default function RatingStars({
  value,
  count,
  interactive = false,
  onRate,
  size = "md",
  disabled = false,
  disabledTitle,
}: RatingStarsProps) {
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const display = hover || value;
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-7 h-7";
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  const handleClick = async (score: number) => {
    if (!interactive || disabled || !onRate || submitting) return;
    setSubmitting(true);
    try {
      await onRate(score);
    } finally {
      setSubmitting(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];

  const content = (
    <div
      className={`inline-flex items-center gap-0.5 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
      title={disabled ? disabledTitle : undefined}
    >
      {stars.map((s) => {
        const filled = s <= Math.floor(display);
        const half = !filled && s - 0.5 <= display;
        return (
          <button
            key={s}
            type="button"
            disabled={!interactive || disabled || submitting}
            onMouseEnter={() => interactive && !disabled && setHover(s)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => handleClick(s)}
            className={`${sizeClass} ${
              interactive && !disabled
                ? "cursor-pointer hover:scale-110 transition-transform"
                : "cursor-default"
            }`}
            aria-label={`${s} yıldız`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`${sizeClass} ${
                filled || half ? "text-orange-500" : "text-navy-200"
              }`}
              fill="currentColor"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        );
      })}
    </div>
  );

  if (count === undefined) {
    return content;
  }

  return (
    <div className="flex items-center gap-2">
      {content}
      {count > 0 ? (
        <span className={`${textClass} text-slate-500 tabular-nums`}>
          {value.toFixed(1)} · {count} puan
        </span>
      ) : (
        <span className={`${textClass} text-slate-400`}>Henüz puan yok</span>
      )}
    </div>
  );
}