import { describe, expect, it } from 'vitest';
import { CYCLE_SECONDS, hourAt, modeOfOverride, overrideForMode, parseOverride, phaseAt, shootingStarWindow } from './time';

describe('sky time rules', () => {
  it('uses local hours without an override', () => {
    expect(hourAt(undefined, 0, new Date(2026, 10, 15, 13, 30, 0))).toBe(13.5);
  });
  it('uses the specified dawn/day/sunset/night boundaries', () => {
    expect([4.99, 5, 7.49, 7.5, 17.49, 17.5, 20.49, 20.5].map(phaseAt)).toEqual(['night', 'dawn', 'dawn', 'day', 'day', 'sunset', 'sunset', 'night']);
  });
  it('accepts only hours 0–23', () => {
    expect(parseOverride('?hour=0')).toEqual({ hour: 0 });
    expect(parseOverride('?hour=23')).toEqual({ hour: 23 });
    expect(parseOverride('?hour=24')).toBeUndefined();
    expect(parseOverride('?hour=-1')).toBeUndefined();
    expect(parseOverride('?hour=')).toBeUndefined();
  });
  it('finishes a complete cycle in 40 seconds starting in daytime', () => {
    const date = new Date(2026, 10, 15);
    expect(CYCLE_SECONDS).toBe(40);
    expect(hourAt({ time: 'cycle' }, 0, date)).toBe(12);
    expect(hourAt({ time: 'cycle' }, 20, date)).toBe(0);
    expect(hourAt({ time: 'cycle' }, 40, date)).toBe(12);
  });
  it('keeps shooting stars 20–40 seconds apart', () => {
    for (let i = 0; i < 100; i++) {
      const gap = shootingStarWindow(i + 1).start - shootingStarWindow(i).start;
      expect(gap).toBeGreaterThanOrEqual(20);
      expect(gap).toBeLessThanOrEqual(40);
    }
  });
  it('gives each switch position its own sky', () => {
    expect(overrideForMode('auto')).toBeUndefined();
    expect(overrideForMode('morning')).toEqual({ time: 'dawn' });
    expect(overrideForMode('night')).toEqual({ time: 'night' });
  });
  it('lights only the position the sky was set to', () => {
    expect(modeOfOverride(undefined)).toBe('auto');
    expect(modeOfOverride({ time: 'dawn' })).toBe('morning');
    expect(modeOfOverride({ time: 'night' })).toBe('night');
    expect(modeOfOverride({ time: 'sunset' })).toBeUndefined();
    expect(modeOfOverride({ hour: 9 })).toBeUndefined();
  });
  it('reads morning as a morning hour', () => {
    expect(phaseAt(hourAt(overrideForMode('morning'), 0, new Date(2026, 10, 15, 13, 0, 0)))).toBe('dawn');
  });
});