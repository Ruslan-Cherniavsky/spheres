import { useState, useCallback, useMemo } from 'react';

export type BloomPreset = 'full' | 'mobile' | 'off';

export type PerfProfile = {
  dpr: number;
  lowDetail: boolean;
  bloom: BloomPreset;
  measured: boolean;
  measuredFps: number;
};

function defaultProfile(isMobile: boolean): PerfProfile {
  if (isMobile) {
    return { dpr: 1.5, lowDetail: true, bloom: 'mobile', measured: false, measuredFps: 0 };
  }
  return { dpr: 2, lowDetail: false, bloom: 'full', measured: false, measuredFps: 0 };
}

function decide(avgFps: number, isMobile: boolean): Omit<PerfProfile, 'measured' | 'measuredFps'> {
  if (isMobile) {
    if (avgFps < 25) return { dpr: 1, lowDetail: true, bloom: 'off' };
    if (avgFps < 40) return { dpr: 1, lowDetail: true, bloom: 'mobile' };
    return { dpr: 1.5, lowDetail: true, bloom: 'mobile' };
  }
  if (avgFps < 25) return { dpr: 1, lowDetail: true, bloom: 'off' };
  if (avgFps < 40) return { dpr: 1, lowDetail: true, bloom: 'mobile' };
  if (avgFps < 55) return { dpr: 1.5, lowDetail: false, bloom: 'full' };
  return { dpr: 2, lowDetail: false, bloom: 'full' };
}

export function usePerfProfile(isMobile: boolean) {
  const initial = useMemo(() => defaultProfile(isMobile), [isMobile]);
  const [profile, setProfile] = useState<PerfProfile>(initial);

  const onMeasured = useCallback(
    (avgFps: number) => {
      setProfile((prev) => {
        if (prev.measured) return prev;
        const next = decide(avgFps, isMobile);
        return { ...next, measured: true, measuredFps: avgFps };
      });
    },
    [isMobile],
  );

  return { profile, onMeasured };
}
