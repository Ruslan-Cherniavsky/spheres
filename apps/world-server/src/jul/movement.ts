import type { Vec3 } from '@spheres/shared';
import type { JulState } from './state.js';
import { JUL_PERSONALITY } from './personality.js';

const DAMPING = 0.96;
const WOBBLE_AMPLITUDE = 0.25;
const PERTURBATION = 0.15;

function randomInRadius(radius: number): Vec3 {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  const y = (Math.random() - 0.5) * radius * 0.6;
  return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
}

function vecLength(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vecSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function applyHomeForce(state: JulState, dt: number): void {
  const dist = vecLength(state.position);
  if (dist < 1) return;

  const { maxRadius, homeForceStrength } = JUL_PERSONALITY;
  let strength = homeForceStrength * (dist / maxRadius);
  if (dist > maxRadius) {
    strength += (dist - maxRadius) * 0.5;
  }

  const factor = -strength * dt / dist;
  state.velocity.x += state.position.x * factor;
  state.velocity.y += state.position.y * factor;
  state.velocity.z += state.position.z * factor;
}

export function updateMovement(state: JulState, dt: number, targetPosition?: Vec3): void {
  const { mode } = state;
  const speed = JUL_PERSONALITY.baseSpeed;

  if (mode === 'wandering') {
    state.wanderTimer -= dt;
    if (state.wanderTimer <= 0) {
      state.wanderTarget = randomInRadius(20);
      state.wanderTimer = 3 + Math.random() * 5;
    }

    const diff = vecSub(state.wanderTarget, state.position);
    const dist = vecLength(diff);
    if (dist > 0.5) {
      const accel = speed * 0.7 * dt;
      state.velocity.x += (diff.x / dist) * accel;
      state.velocity.y += (diff.y / dist) * accel;
      state.velocity.z += (diff.z / dist) * accel;
    }

    const t = Date.now() * 0.001;
    state.velocity.x += Math.sin(t * 1.3) * PERTURBATION * dt;
    state.velocity.y += Math.sin(t * 0.9) * PERTURBATION * dt * 0.5;
    state.velocity.z += Math.cos(t * 1.1) * PERTURBATION * dt;
  } else if (mode === 'approaching' && targetPosition) {
    const diff = vecSub(targetPosition, state.position);
    const dist = vecLength(diff);
    if (dist > 1) {
      const accel = speed * 0.6 * dt;
      state.velocity.x += (diff.x / dist) * accel;
      state.velocity.y += (diff.y / dist) * accel;
      state.velocity.z += (diff.z / dist) * accel;
    }
  } else if (mode === 'talking') {
    state.velocity.x = 0;
    state.velocity.y = 0;
    state.velocity.z = 0;
    return;
  } else if (mode === 'resting') {
    const t = Date.now() * 0.001;
    state.velocity.x += Math.sin(t * 0.7) * WOBBLE_AMPLITUDE * dt;
    state.velocity.y += Math.sin(t * 0.5) * WOBBLE_AMPLITUDE * dt * 0.3;
    state.velocity.z += Math.cos(t * 0.6) * WOBBLE_AMPLITUDE * dt;
  } else if (mode === 'avoiding' && targetPosition) {
    const diff = vecSub(state.position, targetPosition);
    const dist = vecLength(diff);
    if (dist < 20) {
      const flee = speed * 0.5 * dt;
      const safeDist = Math.max(dist, 0.1);
      state.velocity.x += (diff.x / safeDist) * flee;
      state.velocity.y += (diff.y / safeDist) * flee;
      state.velocity.z += (diff.z / safeDist) * flee;
    }
  } else if (mode === 'observing') {
    const t = Date.now() * 0.001;
    state.velocity.x += Math.sin(t * 0.8) * WOBBLE_AMPLITUDE * dt * 0.5;
    state.velocity.z += Math.cos(t * 0.6) * WOBBLE_AMPLITUDE * dt * 0.5;
  }

  applyHomeForce(state, dt);

  state.velocity.x *= DAMPING;
  state.velocity.y *= DAMPING;
  state.velocity.z *= DAMPING;

  const velMag = vecLength(state.velocity);
  const maxVel = speed * 1.5;
  if (velMag > maxVel) {
    const scale = maxVel / velMag;
    state.velocity.x *= scale;
    state.velocity.y *= scale;
    state.velocity.z *= scale;
  }

  state.position.x += state.velocity.x * dt;
  state.position.y += state.velocity.y * dt;
  state.position.z += state.velocity.z * dt;
}
