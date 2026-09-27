import { groupByDate, monthOf, monthRange, shiftMonth, toIsoDate } from '@utils/agenda';

describe('agenda dates', () => {
  it('should format a local date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 9, 6))).toBe('2026-10-06');
  });

  it('should read the month of a date', () => {
    expect(monthOf(new Date(2026, 0, 31))).toStrictEqual({ year: 2026, month: 0 });
  });

  it('should move across years in both directions', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toStrictEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toStrictEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2026, month: 5 }, 0)).toStrictEqual({ year: 2026, month: 5 });
  });

  it('should span the whole month, leap years included', () => {
    expect(monthRange({ year: 2026, month: 9 })).toStrictEqual({
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(monthRange({ year: 2028, month: 1 })).toStrictEqual({
      from: '2028-02-01',
      to: '2028-02-29',
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
