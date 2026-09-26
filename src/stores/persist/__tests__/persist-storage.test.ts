import { plainJsonStorage } from '../persist-storage';

const storage = plainJsonStorage<{ items: string[] }>(
  ({ items }) => items,
  (raw) => ({ items: Array.isArray(raw) ? raw.filter((item) => typeof item === 'string') : [] }),
);

describe('plainJsonStorage', () => {
  it('should save only the stored shape, without the zustand envelope', () => {
    void storage.setItem('key', { state: { items: ['a'] }, version: 0 });
    expect(window.localStorage.getItem('key')).toBe('["a"]');
  });

  it('should read and validate what is stored', () => {
    window.localStorage.setItem('key', '["a", 1]');
    expect(storage.getItem('key')).toStrictEqual({ state: { items: ['a'] }, version: 0 });
  });

  it('should return nothing when the key is missing and remove it on request', () => {
    expect(storage.getItem('missing')).toBeNull();
    window.localStorage.setItem('key', '[]');
    void storage.removeItem('key');
    expect(window.localStorage.getItem('key')).toBeNull();
  });
});
