import { useCallback, useRef } from "react";

interface Props {
  side: "left" | "right";
  onChange: (input: { x: number; y: number }) => void;
}

const BASE_SIZE = 120;
const KNOB_SIZE = 48;
const MAX_RADIUS = (BASE_SIZE - KNOB_SIZE) / 2;
const DEADZONE = 0.15;

const KNOB_COLORS = {
  left:  { bg: "rgba(74,144,217,0.4)",  border: "rgba(74,144,217,0.6)" },
  right: { bg: "rgba(217,144,74,0.4)",  border: "rgba(217,144,74,0.6)" },
};

export default function VirtualJoystick({ side, onChange }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lastOutput = useRef({ x: 0, y: 0 });

  const getCenter = useCallback(() => {
    const rect = baseRef.current!.getBoundingClientRect();
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }, []);

  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      const { cx, cy } = getCenter();
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > MAX_RADIUS) {
        dx = (dx / dist) * MAX_RADIUS;
        dy = (dy / dist) * MAX_RADIUS;
      }

      knobRef.current!.style.transform = `translate(${dx}px, ${dy}px)`;

      let nx = dx / MAX_RADIUS;
      let ny = -(dy / MAX_RADIUS);
      const mag = Math.sqrt(nx * nx + ny * ny);

      if (mag < DEADZONE) {
        nx = 0;
        ny = 0;
      }

      if (nx !== lastOutput.current.x || ny !== lastOutput.current.y) {
        lastOutput.current = { x: nx, y: ny };
        onChange({ x: nx, y: ny });
      }
    },
    [getCenter, onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateKnob(e.clientX, e.clientY);
    },
    [updateKnob],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      updateKnob(e.clientX, e.clientY);
    },
    [updateKnob],
  );

  const handlePointerUp = useCallback(() => {
    knobRef.current!.style.transform = "translate(0px, 0px)";
    if (lastOutput.current.x !== 0 || lastOutput.current.y !== 0) {
      lastOutput.current = { x: 0, y: 0 };
      onChange({ x: 0, y: 0 });
    }
  }, [onChange]);

  const pos = side === "left"
    ? { left: 24, right: undefined }
    : { right: 24, left: undefined };
  const knobColor = KNOB_COLORS[side];

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: "fixed",
        bottom: 80,
        ...pos,
        width: BASE_SIZE,
        height: BASE_SIZE,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        zIndex: 30,
        userSelect: "none",
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: "50%",
          background: knobColor.bg,
          border: `1px solid ${knobColor.border}`,
          willChange: "transform",
          transform: "translate(0px, 0px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
