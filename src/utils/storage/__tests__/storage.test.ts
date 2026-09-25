import { createMemoryStorage } from '@test/memory-storage';
import { getBrowserStorage, readJson, writeJson } from '../storage';

describe('storage', () => {
  it('should return window.localStorage in the browser', () => {
    expect(getBrowserStorage()).toBe(window.localStorage);
  });

  it('should return window.sessionStorage when asked for the session storage', () => {
    expect(getBrowserStorage('session')).toBe(window.sessionStorage);
  });

  it('should return null when localStorage access throws', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getBrowserStorage()).toBeNull();
    spy.mockRestore();
  });

  it('should write and read JSON values', () => {
    const storage = createMemoryStorage();
    writeJson(storage, 'key', { a: 1 });
    expect(readJson(storage, 'key')).toStrictEqual({ a: 1 });
  });

  it('should return null for missing keys, invalid JSON or no storage', () => {
    const storage = createMemoryStorage();
    expect(readJson(storage, 'missing')).toBeNull();
    storage.setItem('broken', '{not json');
    expect(readJson(storage, 'broken')).toBeNull();
    expect(readJson(null, 'key')).toBeNull();
  });

  it('should ignore write errors and missing storage', () => {
    const storage = createMemoryStorage();
    storage.setItem = () => {
      throw new Error('quota');
    };
    expect(() => writeJson(storage, 'key', 1)).not.toThrow();
    expect(() => writeJson(null, 'key', 1)).not.toThrow();
  });
});
