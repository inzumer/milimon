import { interpolate } from '../interpolate';

describe('interpolate', () => {
  it('should replace named placeholders', () => {
    expect(interpolate('Hola {name}, tenés {count} recetas', { name: 'Mili', count: 3 })).toBe(
      'Hola Mili, tenés 3 recetas',
    );
  });

  it('should keep unknown placeholders', () => {
    expect(interpolate('Idioma: {lang}', {})).toBe('Idioma: {lang}');
  });
});
