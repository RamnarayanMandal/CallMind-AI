# AI Voice Agent SaaS — Production Architecture

This project is a comprehensive, scalable AI voice calling platform built with a modular architecture, clean code principles, and high-end design aesthetics.

## 🏗️ Backend Architecture (NestJS)

The backend follows a **Layered Architecture** with strict separation of concerns:
- **Controllers**: Thin entry points for HTTP requests.
- **Services**: Contain business logic and orchestration.
- **Repositories**: Data access layer extending a `BaseRepository` for DRY CRUD and pagination.
- **Schemas**: Mongoose-based MongoDB models with performance-optimized indexes.
- **Providers**: Interfaces for LLM (Sarvam), STT, TTS, and Telephony to ensure system pluggability.

### Key Modules
- **Auth**: JWT-based RBAC (Admin/User).
- **Organization**: Multi-tenant data isolation.
- **Agent**: AI personality and voice configuration.
- **Call/Conversation**: Lifecycle management, transcript storage, and AI analysis.
- **Scheduler**: Bull-queue based background job processing for scheduled calls.

## 🎨 Frontend Architecture (Next.js)

Built with **Next.js 14 (App Router)** and **TypeScript**:
- **Design System**: Global HSL-based design tokens for seamless light/dark mode.
- **State Management**: React Query for server state, local state for UI.
- **API Layer**: Centralized Axios client with JWT interceptors.
- **Components**: Atomic design with reusable shadcn-inspired UI components.
- **Hooks**: Custom React Query hooks following the `service -> hook -> component` pattern.

## 🧠 AI & Call System

### Conversation Loop
1. **Trigger**: Scheduler enqueues a call.
2. **Execution**: Telephony provider initiates a call.
3. **Dialogue**: 
   - Audio input -> STT Result.
   - History + Org Info + Product Info + Agent Tone -> LLM (Sarvam AI).
   - LLM Response -> TTS Audio.
4. **Finalization**: LLM generates a summary, identifies key insights, and classifies the outcome (Interested, Follow-up, etc.).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (for scheduling)

### Backend
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in API keys.
4. `npm run start:dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 📊 API Routes Summary

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |
| GET | `/api/v1/auth/me` | Current profile |
| POST | `/api/v1/organizations` | Create company profile |
| GET | `/api/v1/organizations` | List organizations (paginated) |
| POST | `/api/v1/agents` | Create AI agent |
| POST | `/api/v1/customers/upload-csv` | Bulk upload leads |
| POST | `/api/v1/calls` | Schedule a call campaign |
| GET | `/api/v1/analytics/dashboard`| Get metrics & trends |

---
*Built with ❤️ for high-performance AI voice automation.*
