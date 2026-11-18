import { Clock, Moon, Sunrise } from 'lucide-react';
import { useEffect, useState } from 'react';

import { copy } from '@/shared/copy/patient';
import { setManualSkyTime, SKY_TIME_EVENT } from '../sky/SkyBackground';
import { modeOfOverride, overrideForMode, type SkyMode, type TimeOverride } from '../sky/time';

const MODES: { mode: SkyMode; short: string; full: string; icon: typeof Moon }[] = [
  { mode: 'auto', short: copy.sky.autoShort, full: copy.sky.auto, icon: Clock },
  { mode: 'morning', short: copy.sky.morningShort, full: copy.sky.morning, icon: Sunrise },
  { mode: 'night', short: copy.sky.nightShort, full: copy.sky.night, icon: Moon },
];

/** Switch the sky between the local clock, morning and night without touching the address. */
export function SkyToggle() {
  const [active, setActive] = useState<SkyMode | undefined>();
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('aldi-sky-time');
      setActive(modeOfOverride(saved ? (JSON.parse(saved) as TimeOverride) : undefined));
    } catch { setActive('auto'); }
    const sync = (e: Event) => setActive(modeOfOverride((e as CustomEvent<TimeOverride | undefined>).detail));
    window.addEventListener(SKY_TIME_EVENT, sync);
    return () => window.removeEventListener(SKY_TIME_EVENT, sync);
  }, []);
  return (
    <div className="sky-modes glass-label no-print fixed right-4 top-4 z-20" role="group" aria-label={copy.sky.auto}>
      {MODES.map(({ mode, short, full, icon: Icon }) => (
        <button key={mode} type="button" aria-pressed={active === mode} aria-label={full} title={full}
          onClick={() => setManualSkyTime(overrideForMode(mode))}
          className="sky-mode">
          <Icon aria-hidden="true" className="size-4" />
          <span>{short}</span>
        </button>
      ))}
    </div>
  );
}
