# SPHERES

A minimal, beautiful online 3D demo where users are spheres in a shared dark world.

## Architecture

```
spheres/
├── apps/
│   ├── web/                  React frontend (Vite + R3F)
│   └── world-server/         Node + Socket.io real-time server
├── packages/
│   └── shared/               Shared types and socket protocol
└── package.json              pnpm workspace root
```

**Firebase** handles Auth + user profiles (rare writes).  
**World Server** handles all real-time: movement, chat, contact, presence (in-memory, no DB).

## Prerequisites

- Node.js >= 22
- pnpm >= 10

## Getting Started

```bash
pnpm install
pnpm dev          # starts both web (5173) and server (3001)
```

Or run individually:

```bash
pnpm dev:web      # frontend only
pnpm dev:server   # world server only
```

## Environment Variables

Copy `.env.example` files in each app directory and fill in values:

- `apps/web/.env` — Firebase client config + world server URL
- `apps/world-server/.env` — Port + Firebase Admin credentials
