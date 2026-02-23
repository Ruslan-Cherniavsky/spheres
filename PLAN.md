# SPHERES — Implementation Plan

## Prerequisites & Accounts Checklist

- [x] Firebase project created (`spheres-7cd14`)
- [x] GitHub repo created (`spheres`)
- [ ] **Firebase Console**: Enable Email/Password auth provider
- [ ] **Firebase Console**: Enable Email verification (Settings → User actions)
- [ ] **Firebase Console**: Enable Google sign-in provider
- [ ] **Firebase Console**: Create Firestore database (production mode)
- [ ] **Firebase Console**: Deploy Firestore security rules
- [ ] **Firebase Console**: Generate service account key JSON (Project Settings → Service accounts → Generate new private key)
- [ ] **Railway**: Create account + project, connect GitHub repo
- [ ] **Railway**: Set root directory to `apps/world-server`
- [ ] **Railway**: Configure environment variables (PORT, FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY, CORS_ORIGINS)
- [ ] Create `apps/web/.env` from `.env.example` with real Firebase config
- [ ] Create `apps/world-server/.env` from `.env.example` with service account key

---

## Environment Variables

### Frontend (`apps/web/.env`)

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key (public) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | GA measurement ID (optional) |
| `VITE_WORLD_SERVER_URL` | World server URL (`http://localhost:3001` local) |

### World Server (`apps/world-server/.env`)

| Variable | Description |
|---|---|
| `PORT` | HTTP port (Railway sets this automatically) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full service account JSON as single-line string |
| `CORS_ORIGINS` | Comma-separated allowed origins |

---

## Cost Safety Rules

### What NOT to do with Firebase

1. **NEVER** use Firestore `onSnapshot()` for positions, presence, or world state
2. **NEVER** write player positions to Firestore
3. **NEVER** store chat messages in Firestore
4. **NEVER** use Firestore for real-time presence
5. **NEVER** use Cloud Functions for WebSocket-like behavior
6. **NEVER** log chat content to any database or analytics

### How we throttle

- Position updates: max 10 Hz per client (100ms interval)
- Client-side interpolation fills gaps for smooth rendering
- Firestore writes happen ONLY on:
  - User registration (1 write)
  - Aura change (occasional, debounced)
  - Core rating received (rare, per conversation end)
  - Report submission (rare)
- Expected Firestore usage for 2 test users: < 100 reads/writes per session

---

## Repo Structure

```
spheres/
├── package.json                 Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json           Shared TS config
├── PLAN.md                      This file
├── apps/
│   ├── web/                     React frontend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── .env.example
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── lib/             Firebase, socket client
│   │       ├── stores/          Zustand stores
│   │       ├── pages/           Login, Account, World
│   │       ├── components/      UI components
│   │       ├── i18n/            Translations
│   │       └── styles/          CSS
│   └── world-server/            Node + Socket.io
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       └── src/
│           ├── index.ts         Entry point
│           ├── auth.ts          Firebase token verification
│           ├── world.ts         World state manager
│           └── ai.ts            AI sphere behavior
└── packages/
    └── shared/                  Shared types + protocol
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── types.ts
            ├── protocol.ts
            └── constants.ts
```

---

## Phase 1: Project Scaffolding ✅

- [x] Root workspace config (pnpm-workspace.yaml, package.json, tsconfig.base.json)
- [x] Updated .gitignore
- [x] packages/shared — types, protocol, constants
- [x] apps/web — Vite + React scaffold
- [x] apps/world-server — Express + Socket.io scaffold
- [x] .env.example files
- [ ] `pnpm install` succeeds
- [ ] `pnpm dev` runs both apps
- [ ] Web loads at localhost:5173 showing "SPHERES"
- [ ] Server responds at localhost:3001/health

**Done criteria**: Both apps start locally, shared package resolves, no errors.

---

## Phase 2: Auth + Account Page + Sphere Preview

- [ ] Firebase SDK init (`lib/firebase.ts`)
- [ ] Zustand auth store
- [ ] React Router setup (Login / Account / World routes)
- [ ] Login page: email/password form + Google button
- [ ] Email verification flow
- [ ] Account page layout (left: settings, right: sphere preview)
- [ ] i18n setup (EN/HE/RU)
- [ ] Language selector
- [ ] Aura picker with live preview
- [ ] 3D sphere preview (react-three-fiber)
- [ ] Firestore: create user profile on first login
- [ ] "Enter World" button → navigates to /world

**Done criteria**: Full auth flow works; account page shows sphere that reacts to aura changes.

**Pitfalls**: Firebase Auth popup blocked in some browsers; email verification redirect URL must be configured; RTL support for Hebrew.

---

## Phase 3: 3D World + Flight Controls + UI Overlay

- [ ] World page with R3F Canvas (full viewport)
- [ ] Black background + subtle starfield (instanced points)
- [ ] Player sphere with aura glow (shader or drei effects)
- [ ] WASD + mouse look flight controller with inertia
- [ ] Shift boost multiplier
- [ ] Comet tail (trail effect, client-side only)
- [ ] Camera follow (3rd person, adjustable)
- [ ] HUD overlay: aura button, connection status, worldId
- [ ] Loading state

**Done criteria**: Smooth flight in 3D space with visual polish, no nausea.

**Pitfalls**: Pointer lock UX, gimbal lock with Euler angles (use quaternions), performance with effects.

---

## Phase 4: World Server + Presence + Position Sync

- [ ] Firebase Admin SDK init on server
- [ ] Token verification on `join_world`
- [ ] World state manager (Map<worldId, WorldState>)
- [ ] `update_state` handler (10Hz throttle)
- [ ] Broadcasting: player_update to same-world peers
- [ ] Client interpolation for remote spheres
- [ ] player_joined / player_left events
- [ ] Remote sphere rendering
- [ ] 10 AI spheres with random wander behavior
- [ ] Reconnection handling

**Done criteria**: Two browser tabs see each other's spheres moving smoothly.

**Pitfalls**: Interpolation jitter, auth token expiry, throttle accuracy.

---

## Phase 5: Proximity + Contact Handshake

- [ ] Client-side proximity detection (distance check each frame)
- [ ] "Contact" button when within threshold
- [ ] `request_contact` / `respond_contact` flow
- [ ] Server validates both players exist and are idle
- [ ] Decline cooldown (15s timer)
- [ ] AI auto-accept/decline logic
- [ ] Visual feedback: pending glow, accepted pulse

**Done criteria**: Contact flow works for both real and AI spheres.

**Pitfalls**: Race conditions (both request simultaneously), player disconnects mid-request.

---

## Phase 6: Chat Overlay

- [ ] Semi-transparent chat panel (glassmorphism)
- [ ] Message input + send
- [ ] Scrollable message list
- [ ] Server routes messages (never logs content)
- [ ] Minimum 1 message before "End" enabled
- [ ] "End Conversation" button
- [ ] "Report" button (metadata only → Firestore)
- [ ] Chat cleanup on disconnect

**Done criteria**: Two users chat in real-time, end conversation, report works. Zero message persistence.

**Pitfalls**: XSS in messages (sanitize), scroll-to-bottom UX, overlay transparency vs readability.

---

## Phase 7: Rating + Core Updates

- [ ] Rating popup after chat ends (-2 to +2 scale)
- [ ] Core value calculation (clamped to [-1, 1])
- [ ] Firestore write: update target's coreValue
- [ ] Broadcast `core_updated` to world
- [ ] Core color gradient on sphere (red ↔ blue/white)
- [ ] Prevent duplicate ratings, self-rating

**Done criteria**: Rating changes sphere core color, persists across sessions.

**Pitfalls**: Rating spam (rate limit), concurrent rating writes (use Firestore increment).

---

## Phase 8: Deployment + Smoke Test

- [ ] Frontend build (`vite build`)
- [ ] Deploy frontend (Firebase Hosting or Vercel)
- [ ] Server build (`tsc`)
- [ ] Deploy server to Railway (auto-deploy from GitHub)
- [ ] Configure production env vars on Railway
- [ ] Configure production CORS origins
- [ ] Firestore security rules (restrict to authenticated users, own profile only)
- [ ] Smoke test: 2 real users, complete flow
- [ ] Monitor Firebase usage dashboard
- [ ] Monitor Railway logs

**Done criteria**: Two real users complete: register → enter world → fly → contact → chat → rate.

**Pitfalls**: CORS mismatch, WebSocket upgrade through Railway proxy, Firebase billing alerts.
