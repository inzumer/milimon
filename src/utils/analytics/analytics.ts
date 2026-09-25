/**
 * Analytics facade. Every interaction worth measuring calls `track()`; the provider is wired in
 * phase F8. Until then events go to a no-op sink (or to a sink registered in tests).
 */
export interface AnalyticsEvents {
  language_changed: { from: string; to: string };
  theme_changed: { scheme: 'light' | 'dark' };
  menu_opened: Record<string, never>;
  example_loaded: { formula: string; example: string };
  calculation_completed: { formula: string };
  calculator_reset: { formula: string };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

type Sink = <E extends AnalyticsEventName>(event: E, props: AnalyticsEvents[E]) => void;

const noop: Sink = () => undefined;

let sink: Sink = noop;

export const setAnalyticsSink = (next: Sink | null): void => {
  sink = next ?? noop;
};

export const track = <E extends AnalyticsEventName>(event: E, props: AnalyticsEvents[E]): void => {
  try {
    sink(event, props);
  } catch {
    // Analytics must never break the UI.
  }
};
