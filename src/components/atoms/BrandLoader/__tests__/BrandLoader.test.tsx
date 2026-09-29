import { render, screen } from '@testing-library/react';
import { BrandLoader } from '../BrandLoader';

const mark = () => screen.getByRole('status').querySelector('[aria-hidden="true"]');

describe('BrandLoader', () => {
  it('should pulse the logo while announcing what loads', () => {
    render(<BrandLoader label="Loading your account" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading your account');
    expect(mark()).toHaveClass('animate-pulse');
    expect(mark()?.querySelector('img')?.getAttribute('src')).toContain('logo-mark');
  });

  it('should spin the star, or use the effect given', () => {
    const { unmount } = render(<BrandLoader label="Loading" mark="star" />);
    expect(mark()).toHaveClass('animate-spin');
    expect(mark()?.querySelector('img')?.getAttribute('src')).toContain('star-mark');
    unmount();
    render(<BrandLoader label="Loading" mark="star" effect="pulse" />);
    expect(mark()).toHaveClass('animate-pulse');
  });
});
