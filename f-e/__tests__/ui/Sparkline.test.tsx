import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Sparkline from '@/components/ui/Sparkline';

describe('Sparkline', () => {
  test('renders sparkline with data', () => {
    const data = [10, 15, 12, 18, 20];
    render(<Sparkline data={data} />);
    const svg = screen.getByTestId('sparkline-svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '28');
  });

  test('renders nothing with empty data', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing with null data', () => {
    const { container } = render(<Sparkline data={null as any} />);
    expect(container.firstChild).toBeNull();
  });

  test('applies custom props', () => {
    const data = [10, 15, 20];
    render(<Sparkline data={data} width={100} height={50} stroke="#ff0000" strokeWidth={3} className="custom-class" />);
    const svg = screen.getByTestId('sparkline-svg');
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '50');
    expect(svg).toHaveClass('custom-class');
  });

  test('renders gradient fill when gradient is true', () => {
    const data = [10, 15, 20];
    render(<Sparkline data={data} gradient={true} />);
    const svg = screen.getByTestId('sparkline-svg');
    expect(svg).toBeInTheDocument();
    // Check that defs element exists for gradient
    expect(svg.querySelector('defs')).toBeInTheDocument();
  });

  test('handles single data point', () => {
    const data = [10];
    render(<Sparkline data={data} />);
    const svg = screen.getByTestId('sparkline-svg');
    expect(svg).toBeInTheDocument();
  });

  test('handles flat data (no range)', () => {
    const data = [10, 10, 10];
    render(<Sparkline data={data} />);
    const svg = screen.getByTestId('sparkline-svg');
    expect(svg).toBeInTheDocument();
  });
});