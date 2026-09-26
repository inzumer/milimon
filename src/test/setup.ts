import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useDraftsStore, useHistoryStore, useSettingsStore } from '@stores';

afterEach(() => {
  cleanup();
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useDraftsStore.setState(useDraftsStore.getInitialState(), true);
  useHistoryStore.setState(useHistoryStore.getInitialState(), true);
  window.localStorage.clear();
});
