import { useEffect, useState, useCallback, useRef } from 'react';
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

export default function WorldPage() {
  const user = useAuthStore((s) => s.user);
  const { aura, coreValue, language, setAura } = useUserStore();
  const { connected, remotePlayers, connect, disconnect, nearestPlayer, contactTargetUid, kickedMessage } = useWorldStore();
  const navigate = useNavigate();
  const t = useTranslation();
  const [pointerLocked, setPointerLocked] = useState(false);
  const playerPosRef = useRef(new THREE.Vector3());

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
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        style={{ background: '#000' }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <ambientLight intensity={0.15} />
        <Starfield />
        <FlightController
          aura={aura}
          coreValue={coreValue}
          onLockChange={setPointerLocked}
          onPositionUpdate={(pos) => playerPosRef.current.copy(pos)}
        />
        <ProximityDetector playerPosRef={playerPosRef} />
        {remoteEntries.map(([uid, remote]) => (
          <RemoteSphere
            key={uid}
            uid={uid}
            targetPosition={remote.targetPos}
            aura={remote.state.aura}
            coreValue={remote.state.coreValue}
            isAI={remote.state.isAI}
            highlighted={uid === highlightUid}
          />
        ))}
        <EffectComposer>
          <Bloom
            intensity={1}
            luminanceThreshold={0.1}
            luminanceSmoothing={1}
            mipmapBlur
            radius={0.55}
          />
        </EffectComposer>
      </Canvas>

      <WorldHUD
        aura={aura}
        language={language}
        connected={connected}
        pointerLocked={pointerLocked}
        onAuraChange={setAura}
        onBack={handleBack}
      />
      <ContactOverlay />
      <ChatOverlay />
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
