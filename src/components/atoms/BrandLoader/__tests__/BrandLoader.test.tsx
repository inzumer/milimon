import { render, screen } from '@testing-library/react';
import { getTranslations } from '@i18n';
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

  describe('screen', () => {
    afterEach(() => {
      document.documentElement.lang = '';
    });

    it('should cover the page with the logo and a cooking line in the page language', () => {
      document.documentElement.lang = 'en';
      const text = getTranslations('en', 'loader');
      render(<BrandLoader screen />);
      const dialog = screen.getByRole('dialog', { name: text.label });
      expect(dialog).toHaveAttribute('aria-busy', 'true');
      expect(mark()).toHaveClass('animate-pulse', 'size-24');
      expect(text.messages.filter((message) => screen.queryByText(message))).toHaveLength(1);
    });

    it('should take its own label, in Spanish by default', () => {
      const text = getTranslations('es', 'loader');
      render(<BrandLoader screen label="Iniciando sesión" />);
      expect(screen.getByRole('dialog', { name: 'Iniciando sesión' })).toBeInTheDocument();
      expect(text.messages.some((message) => screen.queryByText(message))).toBe(true);
    });
  });
});
