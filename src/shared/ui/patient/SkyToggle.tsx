import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { copy } from '@/shared/copy/patient';
import { setManualSkyTime, SKY_TIME_EVENT } from '../sky/SkyBackground';
import type { TimeOverride } from '../sky/time';

/** Switch between the night sky and the automatic, clock-driven sky without touching the address. */
export function SkyToggle() {
  const [night, setNight] = useState(false);
  useEffect(() => {
    try { const saved = sessionStorage.getItem('aldi-sky-time'); setNight(saved ? (JSON.parse(saved) as TimeOverride).time === 'night' : false); } catch { /* ignore */ }
    const sync = (e: Event) => setNight((e as CustomEvent<TimeOverride | undefined>).detail?.time === 'night');
    window.addEventListener(SKY_TIME_EVENT, sync);
    return () => window.removeEventListener(SKY_TIME_EVENT, sync);
  }, []);
  const label = night ? copy.sky.auto : copy.sky.night;
  return (
    <button type="button" aria-pressed={night} aria-label={copy.sky.night} title={label}
      onClick={() => setManualSkyTime(night ? undefined : { time: 'night' })}
      className="glass-label no-print fixed right-4 top-4 z-20 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
      {night ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
      <span>{label}</span>
    </button>
  );
}
