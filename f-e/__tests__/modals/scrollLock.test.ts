import { lockScroll, unlockScroll } from '@/components/modals/scrollLock';

describe('scrollLock', () => {
  beforeEach(() => {
    document.body.dataset.modalCount = '0';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  });

  test('increments and decrements modalCount and toggles body overflow', () => {
    lockScroll();
    expect(document.body.dataset.modalCount).toBe('1');
    expect(document.body.style.overflow).toBe('hidden');

    lockScroll();
    expect(document.body.dataset.modalCount).toBe('2');

    unlockScroll();
    expect(document.body.dataset.modalCount).toBe('1');

    unlockScroll();
    expect(document.body.dataset.modalCount).toBe('0');
    expect(document.body.style.overflow).toBe('');
  });
});
