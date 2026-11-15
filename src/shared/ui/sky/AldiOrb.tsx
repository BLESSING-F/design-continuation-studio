import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { OrbState } from './OrbScene';

const OrbScene = lazy(() => import('./OrbScene'));

export function AldiOrb({ state = 'idle', inputLevel = 0, outputLevel = 0, placement = 'start' }: { state?: OrbState; inputLevel?: number; outputLevel?: number; placement?: 'start' | 'call' | 'card' }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let visible = true;
    const sync = () => setPaused(document.hidden || !visible);
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; sync(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', sync); sync();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => {
    const patient = root.current?.closest<HTMLElement>('.theme-patient');
    if (!patient) return;
    patient.dataset['aldiSpeaking'] = state === 'talking' ? 'true' : 'false';
    return () => { delete patient.dataset['aldiSpeaking']; };
  }, [state]);
  return <motion.div ref={root} layoutId="aldi-presence" transition={{ duration: reduced ? 0 : .8, ease: [.22, 1, .36, 1] }} className={`aldi-orb aldi-orb-${placement}`} data-orb-state={state} data-orb-ready={ready ? 'true' : undefined} aria-hidden="true">
    <div className={`orb-surface ${ready ? 'orb-loaded' : ''}`}>
      <ClientOnly fallback={null}><Suspense fallback={null}><OrbScene state={state} inputLevel={inputLevel} outputLevel={outputLevel} reduced={reduced ?? true} paused={paused} onReady={() => setReady(true)} /></Suspense></ClientOnly>
    </div>
  </motion.div>;
}