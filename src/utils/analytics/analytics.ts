export interface AnalyticsEvents {
  language_changed: { from: string; to: string };
  theme_changed: { scheme: 'light' | 'dark' };
  menu_opened: Record<string, never>;
  tool_selected: { formula: string };
  currency_changed: { currency: string };
  example_loaded: { formula: string; example: string };
  calculation_completed: { formula: string };
  calculator_reset: { formula: string };
  calculation_saved: { formula: string };
  cooking_started: { recipe: string };
  cooking_finished: { recipe: string };
  sign_in: { provider: 'google' | 'facebook' };
  sign_in_failed: { provider: 'google' | 'facebook'; reason: 'cancelled' | 'error' };
  sign_out: Record<string, never>;
  history_opened: { formula: string };
  history_deleted: { formula: string };
  page_shared: { method: string; path: string };
  recipe_saved: { recipe: string };
  recipe_unsaved: { recipe: string };
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
