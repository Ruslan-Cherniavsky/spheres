import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { useWorldStore } from '../stores/worldStore';
import FlightController from '../components/world/FlightController';
import RemoteSphere from '../components/world/RemoteSphere';
import Starfield from '../components/world/Starfield';
import ProximityDetector from '../components/world/ProximityDetector';
import WorldHUD from '../components/world/WorldHUD';
import ContactOverlay from '../components/world/ContactOverlay';
import ChatOverlay from '../components/world/ChatOverlay';
import RatingOverlay from '../components/world/RatingOverlay';
import RatingFeedback from '../components/world/RatingFeedback';
import { useTranslation } from '../i18n/useTranslation';
import { useIsMobile } from '../hooks/useDeviceCapabilities';
import VirtualJoystick from '../components/world/VirtualJoystick';

export default function WorldPage() {
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const { aura, coreValue, language, setAura } = useUserStore();
  const { connected, remotePlayers, connect, disconnect, nearestPlayer, contactTargetUid, contactState, kickedMessage, spawnPosition } = useWorldStore();
  const navigate = useNavigate();
  const t = useTranslation();
  const [pointerLocked, setPointerLocked] = useState(false);
  const playerPosRef = useRef(new THREE.Vector3());
  const moveRef = useRef({ x: 0, y: 0 });
  const lookRef = useRef({ x: 0, y: 0 });
  const moveInput = useMemo(() => moveRef.current, []);
  const lookInput = useMemo(() => lookRef.current, []);
  const handleMove = useCallback((input: { x: number; y: number }) => {
    moveRef.current.x = input.x;
    moveRef.current.y = input.y;
  }, []);
  const handleLook = useCallback((input: { x: number; y: number }) => {
    lookRef.current.x = input.x;
    lookRef.current.y = input.y;
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const connectToWorld = async () => {
      try {
        const token = await user.getIdToken();
        if (!cancelled) connect(token, user.uid);
      } catch (e) {
        console.error('Failed to get token:', e);
      }
    };

    connectToWorld();
    return () => {
      cancelled = true;
      disconnect();
    };
  }, [user, connect, disconnect]);

  const handleBack = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    disconnect();
    navigate('/account');
  }, [navigate, disconnect]);

  const remoteEntries = Object.entries(remotePlayers);
  const highlightUid = contactTargetUid ?? nearestPlayer?.uid ?? null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none' }}>
      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        style={{ background: '#000' }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <ambientLight intensity={0.15} />
        <Starfield />
        <FlightController
          aura={aura}
          coreValue={coreValue}
          isMobile={isMobile}
          joystickInput={moveInput}
          lookInput={lookInput}
          onLockChange={setPointerLocked}
          onPositionUpdate={(pos) => playerPosRef.current.copy(pos)}
          initialPosition={spawnPosition ?? undefined}
        />
        <ProximityDetector playerPosRef={playerPosRef} />
        {remoteEntries.map(([uid, remote]) => (
          <RemoteSphere
            key={uid}
            uid={uid}
            lowDetail={isMobile}
            targetPosition={remote.targetPos}
            aura={remote.state.aura}
            coreValue={remote.state.coreValue}
            isAI={remote.state.isAI}
            highlighted={uid === highlightUid}
          />
        ))}
        <EffectComposer>
          <Bloom
            intensity={isMobile ? 0.6 : 1}
            luminanceThreshold={1}
            radius={isMobile ? 0.3 : 0.55}
            luminanceSmoothing={0.025}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <WorldHUD
        aura={aura}
        language={language}
        connected={connected}
        pointerLocked={pointerLocked}
        isMobile={isMobile}
        onAuraChange={setAura}
        onBack={handleBack}
      />
      {isMobile && contactState === 'idle' && (
        <>
          <VirtualJoystick side="left" onChange={handleMove} />
          <VirtualJoystick side="right" onChange={handleLook} />
        </>
      )}
      <ContactOverlay isMobile={isMobile} />
      <ChatOverlay isMobile={isMobile} />
      <RatingOverlay />
      <RatingFeedback />

      {kickedMessage && (
        <div className="kicked-overlay">
          <div className="kicked-panel">
            <p className="kicked-title">{t.world.kicked.title}</p>
            <p className="kicked-message">{t.world.kicked.body}</p>
            <button className="btn btn-primary" onClick={() => navigate('/account')}>
              {t.world.kicked.ok}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
