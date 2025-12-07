import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoModal from '@/components/modals/InfoModal';
import { lockScroll, unlockScroll } from '@/components/modals/scrollLock';

describe('InfoModal', () => {
  test('renders title and children when open', () => {
    const onClose = jest.fn();
    render(
      <InfoModal open={true} onClose={onClose} title={<div>My Title</div>}>
        <div>My content</div>
      </InfoModal>
    );

    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My content')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(
      <InfoModal open={true} onClose={onClose} title={<div>Title</div>}>
        <div>child</div>
      </InfoModal>
    );

    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Escape key pressed', () => {
    const onClose = jest.fn();
    render(
      <InfoModal open={true} onClose={onClose} title={<div>Title</div>}>
        <div>child</div>
      </InfoModal>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not render when open is false', () => {
    const onClose = jest.fn();
    const { queryByText } = render(
      <InfoModal open={false} onClose={onClose} title={<div>Title</div>}>
        <div>child</div>
      </InfoModal>
    );
    expect(queryByText('Title')).not.toBeInTheDocument();
  });

  test('locks/unlocks body when mounting/unmounting', () => {
    document.body.dataset.modalCount = '0';
    const onClose = jest.fn();
    const { unmount } = render(
      <>
        <InfoModal open={true} onClose={onClose} title={<div>Title</div>}>
          <div>child</div>
        </InfoModal>
      </>
    );
    expect(document.body.dataset.modalCount).toBe('1');
    unmount();
    // After unmount, modal count should be 0
    expect(document.body.dataset.modalCount).toBe('0');
  });

  test('multiple modals increment count', () => {
    document.body.dataset.modalCount = '0';
    const onClose = jest.fn();
    const { unmount: u1 } = render(
      <InfoModal open={true} onClose={onClose} title={<div>Title</div>}>
        <div>child</div>
      </InfoModal>
    );
    const { unmount: u2 } = render(
      <InfoModal open={true} onClose={onClose} title={<div>Title2</div>}>
        <div>child</div>
      </InfoModal>
    );
    expect(Number(document.body.dataset.modalCount)).toBeGreaterThanOrEqual(2);
    // Unmount both
    u1();
    u2();
    expect(document.body.dataset.modalCount).toBe('0');
  });
});
