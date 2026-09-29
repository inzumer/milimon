import { groupByDate, toIsoDate, upcomingRange } from '@utils/agenda';

describe('agenda dates', () => {
  it('should format a local date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 9, 6))).toBe('2026-10-06');
  });

  it('should span from today to the given days ahead, across months and years', () => {
    expect(upcomingRange(new Date(2026, 11, 20), 30)).toEqual({
      from: '2026-12-20',
      to: '2027-01-19',
    });
  });

  it('should group items by date keeping their order', () => {
    const a = { date: '2026-10-06', id: 'a' };
    const b = { date: '2026-10-06', id: 'b' };
    const c = { date: '2026-10-13', id: 'c' };
    expect(groupByDate([a, b, c])).toStrictEqual([
      ['2026-10-06', [a, b]],
      ['2026-10-13', [c]],
    ]);
  });
});
