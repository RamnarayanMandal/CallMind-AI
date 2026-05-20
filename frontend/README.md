# CallMind AI — Frontend Developer Guide

> **Production-grade realtime AI voice calling SaaS platform.**  
> Built with Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Quick Start](#2-quick-start)
3. [Directory Architecture](#3-directory-architecture)
4. [Environment Configuration](#4-environment-configuration)
5. [Design System](#5-design-system)
6. [Component Architecture](#6-component-architecture)
7. [State Management](#7-state-management)
8. [API & WebSocket Patterns](#8-api--websocket-patterns)
9. [Authentication Flow](#9-authentication-flow)
10. [Routing & Middleware](#10-routing--middleware)
11. [Performance Guidelines](#11-performance-guidelines)
12. [Testing](#12-testing)
13. [Deployment](#13-deployment)

---

## 1. System Requirements

| Tool       | Version  | Notes                        |
|------------|----------|------------------------------|
| Node.js    | ≥ 20.x   | LTS recommended              |
| npm        | ≥ 10.x   | Bundled with Node            |
| Git        | ≥ 2.40   |                              |
| VS Code    | Latest   | Recommended IDE              |

---

## 2. Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/callmind-ai.git
cd callmind-ai/frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Section 4)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command               | Description                                |
|-----------------------|--------------------------------------------|
| `npm run dev`         | Start Next.js development server           |
| `npm run build`       | Build production bundle                    |
| `npm run start`       | Start production server                    |
| `npm run lint`        | Run ESLint checks                          |
| `npm run type-check`  | Run TypeScript compiler (no emit)          |

---

## 3. Directory Architecture

```
frontend/
├── public/                     # Static assets (icons, images, fonts)
│
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── (public)/           # Unauthenticated routes (layout-free)
│   │   │   ├── page.tsx        # ★ Landing page (Hero, Features, Demo, FAQ)
│   │   │   ├── onboarding/     # ★ Multi-step onboarding wizard
│   │   │   │   └── page.tsx
│   │   │   ├── about/          # About page
│   │   │   ├── login/          # Login page
│   │   │   ├── register/       # Registration page
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── verify-otp/
│   │   │
│   │   ├── (protected)/        # Authenticated routes (with dashboard layout)
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   ├── calls/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   │
│   │   ├── globals.css         # Global CSS + Tailwind base layers
│   │   ├── layout.tsx          # Root layout (fonts, providers, metadata)
│   │   └── favicon.ico
│   │
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui primitives (Button, Card, Badge…)
│   │   ├── layout/             # Navbar, Sidebar, Footer
│   │   ├── agents/             # Agent cards, voice configurator
│   │   ├── calls/              # Call dialer, transcript viewer, waveform
│   │   ├── analytics/          # Charts, metrics cards
│   │   └── shared/             # Loading spinners, error boundaries, modals
│   │
│   ├── contexts/               # React context providers
│   │   ├── AuthContext.tsx     # Authentication state & helpers
│   │   └── ThemeContext.tsx    # Dark/light theme toggle
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Auth state hook
│   │   ├── useWebSocket.ts     # Realtime WebSocket connection hook
│   │   ├── useAudioStream.ts   # Microphone capture & audio streaming
│   │   └── usePagination.ts    # Server-side pagination helper
│   │
│   ├── lib/                    # Utilities & shared logic
│   │   ├── api.ts              # Axios instance + interceptors
│   │   ├── constants.ts        # App-wide constants
│   │   ├── validators.ts       # Zod schemas for form validation
│   │   └── utils.ts            # cn(), formatDuration(), debounce()…
│   │
│   ├── services/               # API service layer (thin wrappers over lib/api)
│   │   ├── authService.ts
│   │   ├── agentService.ts
│   │   ├── callService.ts
│   │   └── analyticsService.ts
│   │
│   ├── store/                  # Zustand global state stores
│   │   ├── useAuthStore.ts
│   │   ├── useAgentStore.ts
│   │   └── useCallStore.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── agent.types.ts
│   │   ├── call.types.ts
│   │   └── api.types.ts
│   │
│   └── middleware.ts           # Next.js edge middleware (auth guards)
│
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## 4. Environment Configuration

Create a `.env.local` file in the `frontend/` directory. **Never commit this file.**

```env
# ── API ────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

# ── WebSocket ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# ── Auth ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_JWT_EXPIRES_IN=7d

# ── Feature Flags ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# ── External Services ─────────────────────────────────────────────────────────
NEXT_PUBLIC_SARVAM_API_KEY=your_sarvam_key_here
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
```

> **Rule**: All variables exposed to the browser **must** be prefixed with `NEXT_PUBLIC_`.  
> Server-only secrets (never exposed to browser) must **not** use this prefix.

---

## 5. Design System

### Color Tokens (defined in `tailwind.config.ts`)

| Token               | Value         | Usage                              |
|---------------------|---------------|------------------------------------|
| `primary-500`       | `#a855f7`     | CTAs, highlights, active states    |
| `secondary-500`     | `#6366f1`     | Accent, agent UI                   |
| `neutral-950`       | `#0a0a0a`     | Page background                    |
| `neutral-900`       | `#171717`     | Card backgrounds                   |
| `neutral-800`       | `#262626`     | Borders, subtle dividers           |

### Typography

- **Font**: Inter (Google Fonts) — loaded via `next/font/google`
- Scale: `text-xs` (10px) → `text-8xl` for hero headings
- All headings use `font-extrabold` + tight `tracking-tight`

### Gradients

```css
/* Defined as Tailwind utilities in globals.css */
.bg-gradient-brand   { background: linear-gradient(135deg, #a855f7, #6366f1); }
.shadow-glow         { box-shadow: 0 0 30px rgba(168,85,247,0.35); }
.bg-gradient-radial  { background: radial-gradient(circle, var(--tw-gradient-stops)); }
```

### Glassmorphism Pattern

```tsx
<div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md shadow-2xl">
  {/* Glass card content */}
</div>
```

---

## 6. Component Architecture

All components follow a **single responsibility** principle. Props are typed with TypeScript interfaces.

### Naming Conventions

| Type             | Convention              | Example                |
|------------------|-------------------------|------------------------|
| Page component   | `PascalCase` default    | `export default function DashboardPage()` |
| UI component     | `PascalCase` named      | `export function AgentCard({ ... })` |
| Hook             | `camelCase` with `use`  | `useWebSocket()`       |
| Service function | `camelCase` verb-noun   | `fetchAgents()`        |
| Type/Interface   | `PascalCase` with suffix| `AgentFormData`        |

### Example Component

```tsx
// src/components/agents/AgentCard.tsx
import type { Agent } from '@/types/agent.types';

interface AgentCardProps {
  agent: Agent;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
      {/* ... */}
    </div>
  );
}
```

---

## 7. State Management

The app uses **Zustand** for global client state and **React Query (TanStack)** for server state.

### Pattern

```
Server Data  →  TanStack Query  →  Component
Client State →  Zustand Store   →  Component
Form State   →  React Hook Form →  Component
```

### Zustand Store Example

```ts
// src/store/useAgentStore.ts
import { create } from 'zustand';
import type { Agent } from '@/types/agent.types';

interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  setAgents: (agents: Agent[]) => void;
  selectAgent: (agent: Agent) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  selectedAgent: null,
  setAgents: (agents) => set({ agents }),
  selectAgent: (agent) => set({ selectedAgent: agent }),
}));
```

---

## 8. API & WebSocket Patterns

### HTTP API (Axios)

```ts
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15000,
});

// Attach JWT token on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### Service Layer Pattern

```ts
// src/services/agentService.ts
import api from '@/lib/api';
import type { Agent, CreateAgentDTO } from '@/types/agent.types';

export const agentService = {
  list: (page = 1, limit = 20) =>
    api.get<{ data: Agent[]; total: number }>('/agents', { params: { page, limit } }),

  create: (dto: CreateAgentDTO) =>
    api.post<Agent>('/agents', dto),

  update: (id: string, dto: Partial<CreateAgentDTO>) =>
    api.patch<Agent>(`/agents/${id}`, dto),

  delete: (id: string) =>
    api.delete(`/agents/${id}`),
};
```

### WebSocket (Realtime Voice)

```ts
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(url: string, options: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => options.onOpen?.();
    ws.onmessage = (e) => options.onMessage(JSON.parse(e.data));
    ws.onclose = () => options.onClose?.();

    wsRef.current = ws;
  }, [url]);

  const send = useCallback((data: unknown) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { send, disconnect };
}
```

### Realtime Audio Streaming Flow

```
Browser Mic → MediaStream → AudioWorklet → PCM chunks
  → WebSocket.send(ArrayBuffer)
    → Backend STT (Sarvam ASR)
      → LLM Response Generation
        → TTS Audio Stream
          → WebSocket.receive(ArrayBuffer)
            → Web Audio API → Speaker
```

---

## 9. Authentication Flow

The app uses **JWT + HTTP-only cookie** strategy.

```
1. User submits credentials  →  POST /api/v1/auth/login
2. Server returns access_token + refresh_token
3. Tokens stored in:
   - access_token  → Zustand store (memory)
   - refresh_token → HTTP-only cookie (server sets)
4. Protected routes check token via Next.js Middleware
5. Token expiry → auto-refresh via axios interceptor
6. Logout → DELETE /api/v1/auth/logout + clear store
```

### Route Groups

| Group         | Path Pattern          | Auth Required |
|---------------|-----------------------|---------------|
| `(public)`    | `/`, `/login`, etc.   | ❌ No         |
| `(protected)` | `/dashboard`, etc.    | ✅ Yes        |

---

## 10. Routing & Middleware

### Middleware (`src/middleware.ts`)

The edge middleware reads the JWT from cookies and redirects unauthenticated users away from protected routes.

```
Request → middleware.ts → check token → allow or redirect
```

**Protected routes** (defined in `middleware.ts`):
- `/dashboard/*`
- `/agents/*`
- `/calls/*`
- `/analytics/*`
- `/settings/*`

---

## 11. Performance Guidelines

- **Images**: Always use `next/image` with explicit `width`/`height` for CLS prevention.
- **Fonts**: Use `next/font/google` with `display: 'swap'`.
- **Dynamic imports**: Use `next/dynamic` for heavy components (charts, dialers).
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` for expensive renders.
- **Bundle analysis**: Run `ANALYZE=true npm run build` periodically.
- **Animation**: Prefer CSS transforms + Framer Motion — avoid layout-triggering properties.

```tsx
// Example: Dynamic import of heavy chart component
const CallAnalyticsChart = dynamic(
  () => import('@/components/analytics/CallAnalyticsChart'),
  { loading: () => <Skeleton className="h-64 w-full" />, ssr: false }
);
```

---

## 12. Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# TypeScript type check
npm run type-check

# Lint check
npm run lint
```

### Test File Conventions

| Type      | Location                         | Naming                    |
|-----------|----------------------------------|---------------------------|
| Unit      | `src/__tests__/`                 | `*.test.ts(x)`            |
| Component | `src/components/**/__tests__/`   | `ComponentName.test.tsx`  |
| E2E       | `e2e/`                           | `*.spec.ts`               |

---

## 13. Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all `NEXT_PUBLIC_*` variables in the Vercel dashboard under **Settings → Environment Variables**.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variable Checklist for Production

- [ ] `NEXT_PUBLIC_API_BASE_URL` → production backend URL
- [ ] `NEXT_PUBLIC_WS_URL` → production WebSocket URL (`wss://`)
- [ ] `NEXT_PUBLIC_SARVAM_API_KEY` → production Sarvam key
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` → analytics key

---

## Support & Contributing

- **Issues**: Open a GitHub issue with reproduction steps
- **PRs**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`)
- **Code Style**: ESLint + Prettier enforced via pre-commit hooks

---

*© 2026 CallMind AI Platform. Built with ❤️ in India.*
