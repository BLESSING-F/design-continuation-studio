export type SkyTime = 'dawn' | 'day' | 'sunset' | 'night' | 'cycle';
export type TimeOverride = { time?: SkyTime; hour?: number };
/** Positions of the on-page switch: the local clock, morning, or night. */
export type SkyMode = 'auto' | 'morning' | 'night';

/** The override each switch position applies; 'auto' hands the sky back to the local clock. */
export function overrideForMode(mode: SkyMode): TimeOverride | undefined {
  if (mode === 'night') return { time: 'night' };
  if (mode === 'morning') return { time: 'dawn' };
  return undefined;
}

/** Which switch position a stored override came from; unknown overrides light nothing. */
export function modeOfOverride(override: TimeOverride | undefined): SkyMode | undefined {
  if (!override) return 'auto';
  if (override.time === 'night') return 'night';
  if (override.time === 'dawn') return 'morning';
  return undefined;
}
export const CYCLE_SECONDS = 40;
export const DEMO_HOURS = { dawn: 6, day: 12, sunset: 19, night: 23 } as const;

export function parseOverride(search: string): TimeOverride | undefined {
  const params = new URLSearchParams(search);
  const time = params.get('time');
  const hour = params.get('hour');
  if (hour !== null && hour.trim() !== '' && Number.isFinite(Number(hour)) && Number(hour) >= 0 && Number(hour) <= 23) return { hour: Number(hour) };
  if (time === 'dawn' || time === 'day' || time === 'sunset' || time === 'night' || time === 'cycle') return { time };
  return undefined;
}

export function hourAt(override: TimeOverride | undefined, elapsed: number, date: Date): number {
  if (override?.hour !== undefined) return override.hour;
  if (override?.time === 'cycle') return (12 + elapsed / CYCLE_SECONDS * 24) % 24;
  if (override?.time) return DEMO_HOURS[override.time];
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

export function phaseAt(hour: number): Exclude<SkyTime, 'cycle'> {
  if (hour >= 5 && hour < 7.5) return 'dawn';
  if (hour >= 7.5 && hour < 17.5) return 'day';
  if (hour >= 17.5 && hour < 20.5) return 'sunset';
  return 'night';
}

export function shootingStarWindow(index: number): { start: number; duration: number } {
  return { start: 24 + index * 30 + Math.sin(index * 3.7) * 4, duration: 1.25 };
}