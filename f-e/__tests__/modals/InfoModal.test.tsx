import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoModal from '@/components/modals/InfoModal';

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
});
