import { interpolate } from '../interpolate';

describe('interpolate', () => {
  it('replaces named placeholders', () => {
    expect(interpolate('Hola {name}, tenés {count} recetas', { name: 'Mili', count: 3 })).toBe(
      'Hola Mili, tenés 3 recetas',
    );
  });

  it('keeps unknown placeholders', () => {
    expect(interpolate('Idioma: {lang}', {})).toBe('Idioma: {lang}');
  });
});
