import React from 'react';

export default function CollapsibleSection({ title, infoButton, children, defaultOpen = true, openKey, borderBottom = true, onOpenChange, open }: { title: React.ReactNode; infoButton?: React.ReactNode | ((open: boolean) => React.ReactNode); children: React.ReactNode; defaultOpen?: boolean; openKey?: string | number | boolean; borderBottom?: boolean; onOpenChange?: (isOpen: boolean) => void; open?: boolean }) {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(() => defaultOpen ?? true);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // toggle using animation on the content
  const toggle = () => {
    if (!contentRef.current) {
      const newOpen = !currentOpen;
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
      return;
    }
    const el = contentRef.current;
    const currentHeight = el.scrollHeight;
    if (currentOpen) {
      // Close: set explicit height then animate to 0
      el.style.height = `${currentHeight}px`;
      // Force reflow so transition occurs
      void el.offsetHeight;
      el.style.transition = 'height 220ms cubic-bezier(0.4,0.8,0.2,1), opacity 160ms ease-out';
      el.style.height = '0px';
      el.style.opacity = '0';
      const handler = function (e: TransitionEvent) {
        if ((e as TransitionEvent).propertyName === 'height') {
          el.style.display = 'none';
          el.style.transition = '';
          el.removeEventListener('transitionend', handler as any);
        }
      };
      el.addEventListener('transitionend', handler as any);
      if (!isControlled) {
        setInternalOpen(false);
      }
      onOpenChange?.(false);
    } else {
      // Open: make sure it's displayed and animate from 0 to scrollHeight
      el.style.display = 'block';
      el.style.height = '0px';
      el.style.opacity = '0';
      // Force reflow
      void el.offsetHeight;
      const target = `${el.scrollHeight}px`;
      el.style.transition = 'height 220ms cubic-bezier(0.4,0.8,0.2,1), opacity 160ms ease-in';
      el.style.height = target;
      el.style.opacity = '1';
      const handler = function (e: TransitionEvent) {
        if ((e as TransitionEvent).propertyName === 'height') {
          el.style.height = 'auto';
          el.style.transition = '';
          el.removeEventListener('transitionend', handler as any);
        }
      };
      el.addEventListener('transitionend', handler as any);
      if (!isControlled) {
        setInternalOpen(true);
      }
      onOpenChange?.(true);
    }
  };

  React.useEffect(() => {
    // Ensure correct initial state immediately on mount
    const el = contentRef.current;
    if (!el) return;
    if (!currentOpen) {
      el.style.display = 'none';
      el.style.height = '0px';
      el.style.opacity = '0';
    } else {
      el.style.display = 'block';
      el.style.height = 'auto';
      el.style.opacity = '1';
    }
  }, [currentOpen]);

  // If `openKey` changes, open the section. This is used by parent controls
  // (e.g., timeframe selectors) to ensure content opens when a relevant
  // setting has changed.
  const prevOpenKeyRef = React.useRef<typeof openKey | undefined>(openKey);
  React.useEffect(() => {
    if (prevOpenKeyRef.current !== undefined && prevOpenKeyRef.current !== openKey) {
      // Open on change - only if not controlled, or if controlled and parent wants to open
      if (!isControlled) {
        setInternalOpen(true);
      }
      onOpenChange?.(true);
    }
    prevOpenKeyRef.current = openKey;
  }, [openKey, isControlled]);

  return (
    <div ref={containerRef} className={`mb-4 ${borderBottom && open ? 'border-b border-gray-200 dark:border-gray-700 pb-4' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        {/* Collapse toggle button (arrow + title) */}
        <button
          type="button"
          aria-label={currentOpen ? 'Collapse section' : 'Expand section'}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 focus:outline-none"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
        >
          <span className={`transition-transform duration-200 ${currentOpen ? '' : 'rotate-180'}`}>▼</span>
          {title}
        </button>
        {/* Info button (separate, does not toggle collapse) */}
        {infoButton && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {typeof infoButton === 'function' ? infoButton(currentOpen) : infoButton}
          </div>
        )}
      </div>
      <div ref={contentRef} className="mt-4 overflow-hidden opacity-100">
        {children}
      </div>
    </div>
  );
}
