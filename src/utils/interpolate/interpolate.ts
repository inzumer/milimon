/** Replaces `{name}` placeholders in a translated string. Unknown placeholders are kept as-is. */
export const interpolate = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{([\w-]+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
