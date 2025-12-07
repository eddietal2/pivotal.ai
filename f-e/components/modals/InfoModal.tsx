import React from 'react';
import { lockScroll, unlockScroll } from './scrollLock';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  onAfterClose?: () => void;
}

export default function InfoModal({ open, onClose, title, children, ariaLabel, onAfterClose }: InfoModalProps) {
  const [rendered, setRendered] = React.useState(open);
  const [closing, setClosing] = React.useState(false);
  const closingHandledRef = React.useRef(false);
  const closeTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (open) {
      setRendered(true);
    }
    if (!open && rendered) {
      // Start the closing animation — the parent unmounted the modal by setting `open=false`.
      setClosing(true);
      // fallback: ensure we unmount to avoid stuck modal if animationend doesn't fire
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      closeTimerRef.current = window.setTimeout(() => {
        if (closingHandledRef.current) return;
        closingHandledRef.current = true;
        setClosing(false);
        setRendered(false);
        if (onAfterClose) {
          try { onAfterClose(); } catch (err) { /* ignore */ }
        }
        // reset handler shortly after to allow next open/close cycle to work
        setTimeout(() => { closingHandledRef.current = false; }, 50);
      }, 420);
    }
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, rendered]);

  // Bind Escape and lock scroll while the modal is actually rendered (visible or closing).
  React.useEffect(() => {
    if (!rendered) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    let locked = false;
    // Lock only if we are rendering the modal
    lockScroll();
    locked = true;
    return () => {
      document.removeEventListener('keydown', onEsc);
      if (locked) {
        unlockScroll();
      }
    };
  }, [rendered, onClose]);

  // `rendered` is still used so we keep the lifecycle flow but the lock/unlock
  // is handled above in the rendered effect. This effect is left for side-effects
  // related to render/unmount in case callers need to add behaviors here.
  React.useEffect(() => {
    return () => {
      /* placeholder for cleanup, lock/unlock are handled elsewhere */
    };
  }, [rendered]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-[102] min-h-screen h-screen w-screen bg-black/50 dark:bg-black/70" role="dialog" aria-modal="true" aria-label={ariaLabel || 'Info Modal'}>
      <div className="absolute inset-0 min-h-screen h-screen w-screen flex items-stretch justify-stretch">
      <div
        className={`bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-sm dark:shadow-2xl w-full min-h-screen h-screen mx-auto relative flex flex-col ${closing ? 'animate-slideDown' : 'animate-slideUp'}`}
        onAnimationEnd={(e) => {
          // only handle the event on the main element (ignore bubbled children animations)
          if (e.currentTarget !== e.target) return;
          if (!closing) return;
          if (closingHandledRef.current) return;
          closingHandledRef.current = true;
          if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          setClosing(false);
          setRendered(false);
          if (onAfterClose) {
            try { onAfterClose(); } catch (err) { /* ignore */ }
          }
          // reset handler shortly after to allow next open/close cycle to work
          setTimeout(() => { closingHandledRef.current = false; }, 50);
        }}
      >
          {/* Header with title and top X close button */}
          <div className="w-full px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">{title}</h4>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl font-bold transition-colors"
              onClick={onClose}
              aria-label="Close modal"
              data-testid="modal-close-top"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-start items-center pt-6 pb-8 px-8 overflow-y-auto w-full max-h-screen"
            style={{ WebkitOverflowScrolling: 'touch' }}>
            {children}
          </div>
          {/* Footer close button pinned to bottom of modal */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={onClose}
              aria-label="Close modal"
              data-testid="modal-close-bottom"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.4, 0.8, 0.2, 1) both; }
        @keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }
        .animate-slideDown { animation: slideDown 0.28s cubic-bezier(0.4, 0.8, 0.2, 1) both; }
      `}</style>
    </div>
  );
}
