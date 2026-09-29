import { articleLinkId, trackingId } from '../tracking';

describe('trackingId', () => {
  it('should build kebab-case ids from a scope, a kind and a name', () => {
    expect(trackingId('waste-factor', 'input', 'wastePercentage')).toBe(
      'waste-factor-input-waste-percentage',
    );
    expect(trackingId('menu', 'button', 'open')).toBe('menu-button-open');
  });

  it('should accept several name parts, numbers and odd characters', () => {
    expect(trackingId('recipe-costing', 'input', 'ingredient', 2, 'unitPrice')).toBe(
      'recipe-costing-input-ingredient-2-unit-price',
    );
    expect(trackingId('history', 'button', 'open', ' Entry #1 ')).toBe(
      'history-button-open-entry-1',
    );
  });

  it('should give CMS article links a stable id from their target', () => {
    expect(articleLinkId('https://www.iag.com.ar/cursos')).toBe(
      'article-link-www-iag-com-ar-cursos',
    );
    expect(articleLinkId('/es/formulas/waste-factor')).toBe(
      'article-link-es-formulas-waste-factor',
    );
    expect(articleLinkId('')).toBe('article-link-link');
  });
});
