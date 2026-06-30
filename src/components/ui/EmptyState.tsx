import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/70 flex items-center justify-center text-3xl">
          {icon}
        </div>
      )}
      <p className="text-navy-950 font-semibold mb-1.5">{title}</p>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
