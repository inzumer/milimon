/** A calendar month: `month` goes from 0 (January) to 11. */
export interface CalendarMonth {
  year: number;
  month: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` of a local date. */
export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const monthOf = (date: Date): CalendarMonth => ({
  year: date.getFullYear(),
  month: date.getMonth(),
});

/** The month `offset` months away (negative goes back). */
export const shiftMonth = ({ year, month }: CalendarMonth, offset: number): CalendarMonth => {
  const index = year * 12 + month + offset;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
};

/** First and last day of a month, as `YYYY-MM-DD` (what the agenda API expects). */
export const monthRange = ({ year, month }: CalendarMonth): { from: string; to: string } => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month + 1)}-01`,
    to: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
};

/** Items grouped by their `date`, in the order they come. */
export const groupByDate = <T extends { date: string }>(items: T[]): [string, T[]][] => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  }
  return [...groups.entries()];
};
