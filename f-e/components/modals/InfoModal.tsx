import React from 'react';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
}

export default function InfoModal({ open, onClose, title, children, ariaLabel }: InfoModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[102] min-h-screen h-screen w-screen bg-black/70" role="dialog" aria-modal="true" aria-label={ariaLabel || 'Info Modal'}>
      <div className="absolute inset-0 min-h-screen h-screen w-screen flex items-stretch justify-stretch">
        <div className="bg-gray-900 border border-gray-700 rounded-t-2xl shadow-2xl w-full min-h-screen h-screen mx-auto relative animate-slideUp flex flex-col">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold z-10"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
          <div className="flex-1 flex flex-col justify-center items-center pt-16 pb-8 px-8 overflow-y-auto w-full">
            <h4 className="text-2xl font-bold mb-6 text-center w-full flex items-center gap-2">{title}</h4>
            {children}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.4, 0.8, 0.2, 1) both; }
      `}</style>
    </div>
  );
}
