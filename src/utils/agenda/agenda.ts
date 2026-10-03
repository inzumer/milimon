const pad = (value: number) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` of a local date. */
export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** From `today` to `days` later, as `YYYY-MM-DD` (what the agenda API expects). */
export const upcomingRange = (today: Date, days: number): { from: string; to: string } => ({
  from: toIsoDate(today),
  to: toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)),
});

/** Items grouped by their `date`, in the order they come. */
export const groupByDate = <T extends { date: string }>(items: T[]): [string, T[]][] => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  }

  return [...groups.entries()];
};
