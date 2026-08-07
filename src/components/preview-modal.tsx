'use client';

import { X } from 'lucide-react';

interface PreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export function PreviewModal({ url, onClose }: PreviewModalProps) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-[95vw] max-h-[95vh] p-4" onClick={e => e.stopPropagation()}>
        <img src={url} alt="preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-800 hover:bg-slate-100 shadow-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
