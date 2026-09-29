import { nextRelease } from '../release';

const madrid = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

describe('release', () => {
  it('should close this Friday at noon and publish the next Monday at 12:30 (Madrid)', () => {
    const { cutoff, publish } = nextRelease(new Date('2026-09-29T08:00:00Z'));
    expect(madrid(cutoff)).toBe('Fri 2 Oct, 12:00');
    expect(madrid(publish)).toBe('Mon 5 Oct, 12:30');
  });

  it('should move to the next week once the cutoff has passed', () => {
    const { cutoff, publish } = nextRelease(new Date('2026-10-02T11:00:00Z'));
    expect(madrid(cutoff)).toBe('Fri 9 Oct, 12:00');
    expect(madrid(publish)).toBe('Mon 12 Oct, 12:30');
  });

  it('should keep the Madrid wall time across the daylight saving change', () => {
    const { cutoff, publish } = nextRelease(new Date('2026-10-24T09:00:00Z'));
    expect(madrid(cutoff)).toBe('Fri 30 Oct, 12:00');
    expect(madrid(publish)).toBe('Mon 2 Nov, 12:30');
  });
});
