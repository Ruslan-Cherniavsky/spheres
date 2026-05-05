import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface Props {
  warmupFrames?: number;
  sampleFrames?: number;
  onResult: (avgFps: number) => void;
  onLiveFps?: (fps: number) => void;
}

export default function PerfProbe({
  warmupFrames = 30,
  sampleFrames = 90,
  onResult,
  onLiveFps,
}: Props) {
  const warmup = useRef(warmupFrames);
  const samples = useRef<number[]>([]);
  const done = useRef(false);

  const liveAcc = useRef(0);
  const liveCount = useRef(0);
  const liveLastEmit = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.max(delta, 1e-4);
    const fps = 1 / dt;

    if (onLiveFps) {
      liveAcc.current += fps;
      liveCount.current += 1;
      const now = performance.now();
      if (now - liveLastEmit.current >= 250) {
        onLiveFps(liveAcc.current / liveCount.current);
        liveAcc.current = 0;
        liveCount.current = 0;
        liveLastEmit.current = now;
      }
    }

    if (done.current) return;

    if (warmup.current > 0) {
      warmup.current -= 1;
      return;
    }

    samples.current.push(fps);
    if (samples.current.length >= sampleFrames) {
      let sum = 0;
      for (let i = 0; i < samples.current.length; i++) sum += samples.current[i];
      const avg = sum / samples.current.length;
      done.current = true;
      onResult(avg);
    }
  });

  return null;
}
