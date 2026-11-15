import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { parseOverride, type TimeOverride } from './time';

export const SKY_TIME_EVENT = 'aldi-sky-time';
/** Manual sky time from the in-page switch; undefined returns to the local clock. */
export function setManualSkyTime(next: TimeOverride | undefined) {
  try { if (next) sessionStorage.setItem('aldi-sky-time', JSON.stringify(next)); else sessionStorage.removeItem('aldi-sky-time'); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(SKY_TIME_EVENT, { detail: next }));
}

const SkyScene = lazy(() => import('./SkyScene'));
export type SkyVariant = "full" | "call" | "veil";

export function SkyBackground({ variant = "full" }: { variant?: SkyVariant }) {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [override, setOverride] = useState<TimeOverride>();
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduced(motion.matches);
    syncMotion();
    const query = parseOverride(window.location.search);
    try {
      const saved = sessionStorage.getItem('aldi-sky-time');
      if (query) { sessionStorage.setItem('aldi-sky-time', JSON.stringify(query)); setOverride(query); }
      else if (saved) {
        const parsed: TimeOverride = JSON.parse(saved);
        const valid = parseOverride(parsed.hour !== undefined ? `?hour=${parsed.hour}` : `?time=${parsed.time}`);
        setOverride(valid);
      }
    } catch { setOverride(query); }
    setConfigured(true);
    const onManual = (e: Event) => setOverride((e as CustomEvent<TimeOverride | undefined>).detail);
    window.addEventListener(SKY_TIME_EVENT, onManual);
    let inView = true;
    const syncVisibility = () => setPaused(document.hidden || !inView);
    syncVisibility();
    const observer = new IntersectionObserver(entries => { inView = (entries[0]?.intersectionRatio ?? 1) > .001; syncVisibility(); }, { threshold: [.001] });
    const patient = root.current?.parentElement;
    if (patient) observer.observe(patient);
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => { window.removeEventListener(SKY_TIME_EVENT, onManual); observer.disconnect(); motion.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);
  return (
    <div ref={root} aria-hidden="true" className="sky-scene" data-scene-ready={ready ? 'true' : undefined} data-sky-motion={reduced ? 'still' : paused ? 'paused' : 'live'}>
      <ClientOnly fallback={null}>
        {configured && <Suspense fallback={null}><SkyScene reduced={reduced} paused={paused} override={override} onReady={() => setReady(true)} /></Suspense>}
      </ClientOnly>
      {variant === "veil" && <div className="sky-veil" />}
    </div>
  );
}
