import { useState, useCallback, useMemo } from 'react';

export type BloomPreset = 'full' | 'mobile' | 'off';

export type PresetName = 'auto' | 'ultra' | 'high' | 'medium' | 'low';

type PerfBaseline = {
  dpr: number;
  lowDetail: boolean;
  bloom: BloomPreset;
};

export type PerfProfile = PerfBaseline & {
  preset: PresetName;
  measured: boolean;
  measuredFps: number;
};

export const PRESETS: Record<Exclude<PresetName, 'auto'>, PerfBaseline> = {
  ultra:  { dpr: 2,   lowDetail: false, bloom: 'full' },
  high:   { dpr: 1.5, lowDetail: false, bloom: 'full' },
  medium: { dpr: 1,   lowDetail: true,  bloom: 'mobile' },
  low:    { dpr: 1,   lowDetail: true,  bloom: 'off' },
};

export const PRESET_ORDER: PresetName[] = ['auto', 'ultra', 'high', 'medium', 'low'];

function defaultProfile(isMobile: boolean): PerfProfile {
  const baseline: PerfBaseline = isMobile
    ? { dpr: 1.5, lowDetail: true, bloom: 'mobile' }
    : { dpr: 2, lowDetail: false, bloom: 'full' };
  return { ...baseline, preset: 'auto', measured: false, measuredFps: 0 };
}

function decide(avgFps: number, isMobile: boolean): PerfBaseline {
  if (isMobile) {
    if (avgFps < 25) return PRESETS.low;
    if (avgFps < 40) return PRESETS.medium;
    return { dpr: 1.5, lowDetail: true, bloom: 'mobile' };
  }
  if (avgFps < 25) return PRESETS.low;
  if (avgFps < 40) return PRESETS.medium;
  if (avgFps < 55) return { dpr: 1.5, lowDetail: false, bloom: 'full' };
  return PRESETS.ultra;
}

export function usePerfProfile(isMobile: boolean) {
  const initial = useMemo(() => defaultProfile(isMobile), [isMobile]);
  const [profile, setProfile] = useState<PerfProfile>(initial);
  const [probeNonce, setProbeNonce] = useState(0);

  const onMeasured = useCallback(
    (avgFps: number) => {
      setProfile((prev) => {
        if (prev.preset !== 'auto' || prev.measured) return prev;
        const next = decide(avgFps, isMobile);
        return { ...next, preset: 'auto', measured: true, measuredFps: avgFps };
      });
    },
    [isMobile],
  );

  const setPreset = useCallback(
    (preset: PresetName) => {
      if (preset === 'auto') {
        setProfile(defaultProfile(isMobile));
        setProbeNonce((n) => n + 1);
        return;
      }
      const baseline = PRESETS[preset];
      setProfile({ ...baseline, preset, measured: true, measuredFps: 0 });
    },
    [isMobile],
  );

  return { profile, onMeasured, setPreset, probeNonce };
}
