import { useEffect, useState } from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { WORLD_CONFIG } from '@spheres/shared';

export default function ContactOverlay() {
  const nearestPlayer = useWorldStore((s) => s.nearestPlayer);
  const contactState = useWorldStore((s) => s.contactState);
  const incomingFromUid = useWorldStore((s) => s.incomingFromUid);
  const cooldowns = useWorldStore((s) => s.cooldowns);
  const requestContact = useWorldStore((s) => s.requestContact);
  const respondContact = useWorldStore((s) => s.respondContact);
  const requestStartedAt = useWorldStore((s) => s.requestStartedAt);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const isOnCooldown =
    nearestPlayer &&
    cooldowns[nearestPlayer.uid] &&
    cooldowns[nearestPlayer.uid] > now;

  const cooldownLeft = isOnCooldown
    ? Math.ceil((cooldowns[nearestPlayer!.uid] - now) / 1000)
    : 0;

  const timeoutLeft = requestStartedAt
    ? Math.max(0, Math.ceil((requestStartedAt + WORLD_CONFIG.contactRequestTimeoutMs - now) / 1000))
    : null;

  return (
    <div className="contact-overlay">
      {/* Near a sphere + idle + no cooldown */}
      {contactState === 'idle' && nearestPlayer && !isOnCooldown && (
        <div className="contact-prompt">
          <span className="contact-hint">Press E to Contact</span>
          <button
            className="hud-btn contact-btn"
            onPointerDown={(e) => {
              e.stopPropagation();
              requestContact(nearestPlayer.uid);
            }}
          >
            Contact
          </button>
        </div>
      )}

      {/* Near a sphere + cooldown */}
      {contactState === 'idle' && nearestPlayer && isOnCooldown && (
        <div className="contact-prompt">
          <span className="contact-cooldown">Cooldown {cooldownLeft}s</span>
        </div>
      )}

      {/* Outgoing request pending */}
      {contactState === 'outgoing' && (
        <div className="contact-prompt">
          <span className="contact-pending">
            Requesting contact...
            {timeoutLeft !== null && <span className="contact-timer">{timeoutLeft}s</span>}
          </span>
        </div>
      )}

      {/* Incoming request */}
      {contactState === 'incoming' && incomingFromUid && (
        <div className="contact-incoming">
          <p className="contact-incoming-title">
            Contact Request
            {timeoutLeft !== null && <span className="contact-timer">{timeoutLeft}s</span>}
          </p>
          <div className="contact-actions">
            <button
              className="btn btn-primary"
              onPointerDown={(e) => {
                e.stopPropagation();
                respondContact(incomingFromUid, true);
              }}
            >
              Accept
            </button>
            <button
              className="btn btn-secondary"
              onPointerDown={(e) => {
                e.stopPropagation();
                respondContact(incomingFromUid, false);
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
