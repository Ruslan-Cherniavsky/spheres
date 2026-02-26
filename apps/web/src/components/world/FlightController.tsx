import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AURA_COLORS, WORLD_CONFIG } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';
import { useWorldStore } from '../../stores/worldStore';
import PlayerSphere from './PlayerSphere';

const FLIGHT = {
  normalSpeed: 25,
  boostSpeed: 60,
  acceleration: 80,
  damping: 0.92,
  mouseSensitivity: 0.002,
  maxPitch: Math.PI * 0.44,
  cameraDistance: 5,
  cameraHeight: 1.5,
  cameraLerp: 8,
} as const;

const TRAIL_LEN = 120;

// Reusable objects — allocated once, never per-frame
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _inputDir = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _idealPos = new THREE.Vector3();
const _cameraOffset = new THREE.Vector3();
const _toTarget = new THREE.Vector3();

interface Props {
  aura: AuraType;
  coreValue: number;
  onPositionUpdate?: (pos: THREE.Vector3, vel: THREE.Vector3) => void;
  onLockChange?: (locked: boolean) => void;
}

export default function FlightController({
  aura,
  coreValue,
  onPositionUpdate,
  onLockChange,
}: Props) {
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null!);

  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isLocked = useRef(false);
  const lastSendTime = useRef(0);
  const sendInterval = 1000 / WORLD_CONFIG.positionUpdateRateHz;
  const sendPositionUpdate = useWorldStore((s) => s.sendPositionUpdate);
  const currentSpeed = useRef(0);

  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false,
  });

  // ── Custom trail (line-based, no MeshLine artifacts) ──

  const trailData = useMemo(() => {
    const positions = new Float32Array(TRAIL_LEN * 3);
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setDrawRange(0, 0);
    return { positions, geo, count: 0 };
  }, []);

  const trailColor = useMemo(
    () => new THREE.Color(AURA_COLORS[aura]).multiplyScalar(0.35),
    [aura],
  );

  const trailLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: trailColor, transparent: true, opacity: 0.4, depthWrite: false });
    const line = new THREE.Line(trailData.geo, mat);
    line.frustumCulled = false;
    return line;
  }, [trailData, trailColor]);

  useEffect(() => {
    return () => { trailData.geo.dispose(); trailLine.material.dispose(); };
  }, [trailData, trailLine]);

  // ── Keyboard ────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (e.code) {
      case 'KeyW': keys.current.w = true; break;
      case 'KeyA': keys.current.a = true; break;
      case 'KeyS': keys.current.s = true; break;
      case 'KeyD': keys.current.d = true; break;
      case 'ShiftLeft':
      case 'ShiftRight': keys.current.shift = true; break;
      case 'Space': keys.current.space = true; e.preventDefault(); break;
      case 'KeyE': {
        const { nearestPlayer, contactState, requestContact } =
          useWorldStore.getState();
        if (nearestPlayer && contactState === 'idle') {
          requestContact(nearestPlayer.uid);
        }
        break;
      }
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (e.code) {
      case 'KeyW': keys.current.w = false; break;
      case 'KeyA': keys.current.a = false; break;
      case 'KeyS': keys.current.s = false; break;
      case 'KeyD': keys.current.d = false; break;
      case 'ShiftLeft':
      case 'ShiftRight': keys.current.shift = false; break;
      case 'Space': keys.current.space = false; break;
    }
  }, []);

  // ── Mouse look ──────────────────────────

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isLocked.current) return;
    yaw.current -= e.movementX * FLIGHT.mouseSensitivity;
    pitch.current -= e.movementY * FLIGHT.mouseSensitivity;
    pitch.current = THREE.MathUtils.clamp(
      pitch.current,
      -FLIGHT.maxPitch,
      FLIGHT.maxPitch,
    );
  }, []);

  // ── Pointer lock ────────────────────────

  const handleClick = useCallback(() => {
    if (!isLocked.current) {
      gl.domElement.requestPointerLock();
    }
  }, [gl]);

  const handleLockChange = useCallback(() => {
    isLocked.current = document.pointerLockElement === gl.domElement;
    onLockChange?.(isLocked.current);
  }, [gl, onLockChange]);

  useEffect(() => {
    const canvas = gl.domElement;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handleLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, [gl, handleKeyDown, handleKeyUp, handleMouseMove, handleClick, handleLockChange]);

  // ── Frame loop ──────────────────────────

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const store = useWorldStore.getState();
    const chatting = store.contactState === 'chatting' || store.contactState === 'rating';

    if (chatting && store.contactTargetUid) {
      const remote = store.remotePlayers[store.contactTargetUid];
      if (remote) {
        _toTarget.set(
          remote.targetPos.x - group.position.x,
          remote.targetPos.y - group.position.y,
          remote.targetPos.z - group.position.z,
        );
        if (_toTarget.lengthSq() > 0.01) {
          const targetYaw = Math.atan2(-_toTarget.x, -_toTarget.z);
          const horizDist = Math.sqrt(_toTarget.x * _toTarget.x + _toTarget.z * _toTarget.z);
          const targetPitch = Math.atan2(_toTarget.y, horizDist);

          const lerpSpeed = 4 * dt;
          yaw.current += (targetYaw - yaw.current) * Math.min(lerpSpeed, 1);
          pitch.current += (targetPitch - pitch.current) * Math.min(lerpSpeed, 1);
        }
      }
    }

    // Orientation (always update so camera stays correct)
    _euler.set(pitch.current, yaw.current, 0, 'YXZ');
    _quat.setFromEuler(_euler);

    if (!chatting) {
      const maxSpeed = k.shift ? FLIGHT.boostSpeed : FLIGHT.normalSpeed;

      // Direction vectors
      _forward.set(0, 0, -1).applyQuaternion(_quat);
      _right.set(1, 0, 0).applyQuaternion(_quat);

      // Accumulate input
      _inputDir.set(0, 0, 0);
      if (k.w) _inputDir.add(_forward);
      if (k.s) _inputDir.sub(_forward);
      if (k.d) _inputDir.add(_right);
      if (k.a) _inputDir.sub(_right);
      if (k.space) _inputDir.y += 1;

      if (_inputDir.lengthSq() > 0) {
        _inputDir.normalize().multiplyScalar(FLIGHT.acceleration * dt);
        velocity.current.add(_inputDir);
      }

      // Clamp to max speed
      if (velocity.current.length() > maxSpeed) {
        velocity.current.normalize().multiplyScalar(maxSpeed);
      }

      // Frame-rate-independent damping
      velocity.current.multiplyScalar(Math.pow(FLIGHT.damping, dt * 60));

      // Kill micro-drift
      if (velocity.current.lengthSq() < 0.0001) {
        velocity.current.set(0, 0, 0);
      }

      // Move
      group.position.addScaledVector(velocity.current, dt);
      currentSpeed.current = velocity.current.length();
    } else {
      velocity.current.set(0, 0, 0);
      currentSpeed.current = 0;
    }

    group.quaternion.copy(_quat);

    // Camera follow
    _cameraOffset
      .set(0, FLIGHT.cameraHeight, FLIGHT.cameraDistance)
      .applyQuaternion(_quat);
    _idealPos.copy(group.position).add(_cameraOffset);

    const lerpFactor = 1 - Math.exp(-FLIGHT.cameraLerp * dt);
    camera.position.lerp(_idealPos, lerpFactor);
    camera.lookAt(group.position);

    onPositionUpdate?.(group.position, velocity.current);

    // ── Update trail ──────────────────────
    const td = trailData;
    const px = group.position.x, py = group.position.y, pz = group.position.z;

    if (td.count < TRAIL_LEN) {
      td.positions[td.count * 3] = px;
      td.positions[td.count * 3 + 1] = py;
      td.positions[td.count * 3 + 2] = pz;
      td.count++;
    } else {
      td.positions.copyWithin(0, 3);
      td.positions[(TRAIL_LEN - 1) * 3] = px;
      td.positions[(TRAIL_LEN - 1) * 3 + 1] = py;
      td.positions[(TRAIL_LEN - 1) * 3 + 2] = pz;
    }

    (td.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    td.geo.setDrawRange(0, td.count);

    // Throttled network send (10 Hz)
    const now = performance.now();
    if (now - lastSendTime.current >= sendInterval) {
      sendPositionUpdate(
        { x: px, y: py, z: pz },
        { x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w },
        aura,
      );
      lastSendTime.current = now;
    }
  });

  // ── Render ──────────────────────────────

  return (
    <>
      {/* Trail — world-space line, outside the moving group */}
      <primitive object={trailLine} />

      <group ref={groupRef}>
        <PlayerSphere aura={aura} coreValue={coreValue} speed={currentSpeed.current} emitLight />
      </group>
    </>
  );
}
