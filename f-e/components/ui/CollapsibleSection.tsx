import React from 'react';

export default function CollapsibleSection({ title, infoButton, children, defaultOpen = true, openKey, borderBottom = true, onOpenChange, open, hideHeader = false }: { title: React.ReactNode; infoButton?: React.ReactNode | ((open: boolean) => React.ReactNode); children: React.ReactNode; defaultOpen?: boolean; openKey?: string | number | boolean; borderBottom?: boolean; onOpenChange?: (isOpen: boolean) => void; open?: boolean; hideHeader?: boolean }) {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(() => defaultOpen ?? true);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);

  // Sharp, cool easing curve - quick start, smooth deceleration
  const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'; // expo out - feels snappy and premium
  const DURATION = 350; // ms - long enough to feel smooth, short enough to feel responsive

  // toggle using animation on the content
  const toggle = () => {
    if (!contentRef.current || !innerRef.current || isAnimating) {
      const newOpen = !currentOpen;
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
      return;
    }
    
    setIsAnimating(true);
    const el = contentRef.current;
    const inner = innerRef.current;
    
    if (currentOpen) {
      // === CLOSE ANIMATION ===
      const targetHeight = inner.scrollHeight;
      // Start from current height
      el.style.height = `${targetHeight}px`;
      el.style.overflow = 'hidden';
      inner.style.transform = 'translateY(0)';
      inner.style.opacity = '1';
      
      // Force reflow
      void el.offsetHeight;
      
      // Animate to closed
      el.style.transition = `height ${DURATION}ms ${EASING}`;
      inner.style.transition = `transform ${DURATION}ms ${EASING}, opacity ${DURATION * 0.6}ms ease-out`;
      
      el.style.height = '0px';
      inner.style.transform = 'translateY(-20px)';
      inner.style.opacity = '0';
      
      const cleanup = () => {
        el.style.display = 'none';
        el.style.transition = '';
        inner.style.transition = '';
        setIsAnimating(false);
      };
      
      setTimeout(cleanup, DURATION);
      
      if (!isControlled) {
        setInternalOpen(false);
      }
      onOpenChange?.(false);
    } else {
      // === OPEN ANIMATION ===
      // First, make visible but at 0 height to measure content
      el.style.display = 'block';
      el.style.height = 'auto';
      el.style.overflow = 'hidden';
      el.style.visibility = 'hidden';
      el.style.position = 'absolute';
      
      // Force reflow to measure
      void el.offsetHeight;
      const targetHeight = inner.scrollHeight;
      
      // Reset to starting position for animation
      el.style.visibility = '';
      el.style.position = '';
      el.style.height = '0px';
      inner.style.transform = 'translateY(20px)';
      inner.style.opacity = '0';
      
      // Force reflow before animation
      void el.offsetHeight;
      
      // Animate to open
      el.style.transition = `height ${DURATION}ms ${EASING}`;
      inner.style.transition = `transform ${DURATION}ms ${EASING}, opacity ${DURATION * 0.7}ms ease-in ${DURATION * 0.1}ms`;
      
      el.style.height = `${targetHeight}px`;
      inner.style.transform = 'translateY(0)';
      inner.style.opacity = '1';
      
      const cleanup = () => {
        el.style.height = 'auto';
        el.style.overflow = '';
        el.style.transition = '';
        inner.style.transition = '';
        setIsAnimating(false);
      };
      
      setTimeout(cleanup, DURATION);
      
      if (!isControlled) {
        setInternalOpen(true);
      }
      onOpenChange?.(true);
    }
  };

  React.useEffect(() => {
    // Ensure correct initial state immediately on mount (no animation)
    const el = contentRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    
    if (!currentOpen) {
      el.style.display = 'none';
      el.style.height = '0px';
      inner.style.opacity = '0';
      inner.style.transform = 'translateY(-20px)';
    } else {
      el.style.display = 'block';
      el.style.height = 'auto';
      inner.style.opacity = '1';
      inner.style.transform = 'translateY(0)';
    }
  }, []);

  // Sync DOM state when controlled `open` prop changes externally (without animation)
  // This handles cases where parent changes the open state directly (e.g., fixed header toggle)
  const prevOpenRef = React.useRef<boolean>(currentOpen);
  React.useEffect(() => {
    // Only sync if the value actually changed and we're not animating
    if (prevOpenRef.current !== currentOpen && !isAnimating) {
      const el = contentRef.current;
      const inner = innerRef.current;
      if (el && inner) {
        if (!currentOpen) {
          el.style.display = 'none';
          el.style.height = '0px';
          inner.style.opacity = '0';
          inner.style.transform = 'translateY(-20px)';
        } else {
          el.style.display = 'block';
          el.style.height = 'auto';
          inner.style.opacity = '1';
          inner.style.transform = 'translateY(0)';
        }
      }
    }
    prevOpenRef.current = currentOpen;
  }, [currentOpen, isAnimating]);

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
      {!hideHeader && (
      <div className="flex items-center justify-between gap-2">
        {/* Collapse toggle button (arrow + title) */}
        <button
          type="button"
          aria-label={currentOpen ? 'Collapse section' : 'Expand section'}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 focus:outline-none group"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          disabled={isAnimating}
        >
          <span 
            className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${currentOpen ? '' : 'rotate-180'}`}
            style={{ transformOrigin: 'center' }}
          >
            ▼
          </span>
          {title}
        </button>
        {/* Info button (separate, does not toggle collapse) */}
        {infoButton && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {typeof infoButton === 'function' ? infoButton(currentOpen) : infoButton}
          </div>
        )}
      </div>
      )}
      <div ref={contentRef} className="overflow-hidden">
        <div ref={innerRef} className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
