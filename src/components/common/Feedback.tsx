import React from 'react';
import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export function ToastViewport() {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-[#202A27] text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 text-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.tone === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-[#6AD49B] shrink-0" />
            )}
            {toast.tone === 'info' && <Info className="w-4 h-4 text-[#F28C52] shrink-0" />}
            {toast.tone === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="truncate">{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-white/60 hover:text-white transition-colors shrink-0 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#E8ECE8] rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-[#EEF2EC]" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-[#EEF2EC] rounded" />
        <div className="h-4 w-4/5 bg-[#EEF2EC] rounded" />
        <div className="h-4 w-1/2 bg-[#EEF2EC] rounded" />
        <div className="h-9 w-full bg-[#EEF2EC] rounded-lg mt-2" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white border border-[#E8ECE8] rounded-2xl p-10 text-center max-w-lg mx-auto">
      <h3 className="font-display text-lg font-semibold text-[#202A27] mb-2">{title}</h3>
      <p className="text-sm text-[#777F7B] leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium hover:bg-[#1E5C3D] transition-colors whitespace-nowrap cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
