export function lockScroll() {
  if (typeof window === 'undefined') return;
  const current = Number(document.body.dataset.modalCount || '0');
  const next = current + 1;
  document.body.dataset.modalCount = String(next);
  if (next === 1) {
    // first modal opened — lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
}

export function unlockScroll() {
  if (typeof window === 'undefined') return;
  const current = Number(document.body.dataset.modalCount || '0');
  const next = Math.max(0, current - 1);
  document.body.dataset.modalCount = String(next);
  if (next === 0) {
    // no modals open — restore body scroll
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
}
