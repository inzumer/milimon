import { RELEASE_CUTOFF, RELEASE_PUBLISH, RELEASE_TIME_ZONE } from '@constants';

interface WallTime {
  weekday: number;
  hour: number;
  minute: number;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Wall-clock parts of `date` in `timeZone` (weekday 0 = Sunday). */
const wallTime = (date: Date, timeZone: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts['weekday'] ?? '');
  return { weekday, hour: Number(parts['hour']), minute: Number(parts['minute']) };
};

/** The first moment after `now` whose wall time in `timeZone` is `target`. */
const nextAt = (now: Date, target: WallTime, timeZone: string): Date => {
  const current = wallTime(now, timeZone);
  const minutesNow = current.weekday * 1440 + current.hour * 60 + current.minute;
  const minutesTarget = target.weekday * 1440 + target.hour * 60 + target.minute;
  const ahead = (minutesTarget - minutesNow + 7 * 1440) % (7 * 1440) || 7 * 1440;
  const guess = new Date(Math.floor(now.getTime() / MINUTE) * MINUTE + ahead * MINUTE);
  // A daylight saving change in between moves the wall time by an hour: correct it.
  const drift = wallTime(guess, timeZone).hour - target.hour;
  return new Date(guess.getTime() - (((((drift + 36) % 24) - 12) * 60 * MINUTE) % DAY));
};

/** When the next release closes (merged to dev before) and when it is published. */
export const nextRelease = (now: Date, timeZone: string = RELEASE_TIME_ZONE) => {
  const cutoff = nextAt(now, RELEASE_CUTOFF, timeZone);
  const publish = nextAt(cutoff, RELEASE_PUBLISH, timeZone);
  return { cutoff, publish };
};
