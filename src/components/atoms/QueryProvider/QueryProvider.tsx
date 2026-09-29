import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getQueryClient } from '@services/query';

/** Gives an island the page's shared query cache (each Astro island is its own React root). */
export const QueryProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
);
