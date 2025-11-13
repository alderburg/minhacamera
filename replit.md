# MinhaCamera.com - Sistema de Gerenciamento de Câmeras IP

## Overview

MinhaCamera.com is a white-label IP camera management system that enables real-time viewing of RTSP camera streams. The platform supports multi-tenancy through companies (empresas), with hierarchical access control for super admins, company admins, and end-user clients. The system focuses on live streaming with infrastructure prepared for future recording and compression features.

**Core Purpose**: Provide a professional SaaS dashboard for managing and viewing IP cameras across multiple companies with role-based access control.

**Technology Stack**:
- Frontend: React + TypeScript + Tailwind CSS + Shadcn/UI
- Backend: Node.js + Express + Drizzle ORM
- Database: PostgreSQL
- Streaming: RTSP → HLS conversion via FFmpeg
- Authentication: JWT-based with HTTP-only cookies

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenant Data Model

The system implements a hierarchical multi-tenant architecture:

**Tenant Hierarchy**:
- **Super Admin**: System-wide access to all companies, clients, and cameras
- **Company (Empresa)**: White-label tenant with isolated data
- **Company Admin**: Manages clients and cameras within their company
- **End-User Client**: Views assigned cameras only

**Database Schema** (Drizzle ORM with PostgreSQL):
- `users`: Authentication with role-based access (super_admin, admin, user)
- `empresas`: Company/tenant records with white-label support (logo, domain)
- `clientes`: End-user clients linked to companies
- `cameras`: IP cameras with RTSP URLs linked to companies
- `camera_acessos`: Many-to-many access control (cameras ↔ clients)

**Design Rationale**: Multi-tenancy through `empresaId` foreign keys ensures data isolation while super admins can override filters. The `camera_acessos` junction table provides granular permission control at the camera level.

### Authentication & Authorization

**JWT-Based Authentication**:
- Tokens stored in HTTP-only cookies for security
- Middleware validates tokens and extracts user context
- Role-based access control (RBAC) through `requireRole()` middleware

**Access Control Rules**:
- Super Admin: Bypasses company filters, sees all data
- Company Admin: Filtered by `empresaId`, manages own company
- End User: Access controlled via `camera_acessos` table

**Security Considerations**: 
- Passwords hashed with bcryptjs
- Session secret from environment variables
- SSL enforced in production (Railway deployment)

### Video Streaming Architecture

**RTSP to HLS Conversion**:
- Backend converts RTSP streams to HLS format using FFmpeg
- Stream files stored in `/streams/camera-{id}/` directories
- Playlist files (`.m3u8`) served via Express static routes

**Client-Side Playback**:
- HLS.js library for browser compatibility
- Native HLS support for Safari
- Auto-cleanup of stream sessions

**Design Decision**: HLS chosen over direct RTSP because:
- Browser compatibility (RTSP not natively supported)
- Adaptive bitrate potential
- Lower latency than alternatives like RTMP
- Prepared for future recording features

**Future Expansion**: Schema includes `diasGravacao` and `resolucaoPreferida` fields for upcoming recording functionality.

### Frontend Architecture

**Responsive Design System**:
- Desktop: Sidebar navigation with main content area
- Mobile: App-like interface with bottom navigation and top gradient bar
- Breakpoint: 768px (md) switches between layouts

**Component Structure**:
- Shadcn/UI for consistent design system
- Custom components: `CameraPlayer`, `CameraStatus`, `MobileTopBar`
- Route-based layouts with Wouter (lightweight React Router alternative)

**State Management**:
- React Query for server state and caching
- Context API for authentication state
- Local state for UI interactions

**Design System**: Based on modern SaaS patterns (Linear, Vercel) with:
- Inter font for UI, JetBrains Mono for technical data
- Tailwind CSS with custom design tokens
- Card-based layouts with consistent spacing primitives

### API Design

**RESTful Endpoints**:
- `/api/auth/*`: Login, logout, session management
- `/api/dashboard/stats`: Aggregated statistics by role
- `/api/empresas`, `/api/clientes`, `/api/cameras`: CRUD operations
- `/api/stream/:id/start`: Initiate camera streaming
- `/api/cameras/:id/acessos`: Manage camera-client permissions

**Role-Based Filtering**:
- Super admin endpoints return all data
- Admin endpoints filter by `user.empresaId`
- User endpoints filter by `camera_acessos` relationships

**Error Handling**: Consistent JSON error responses with HTTP status codes.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store hosted on Railway
- **Drizzle ORM**: Type-safe database access with schema validation
- **Connection**: SSL-enabled connection string via `DATABASE_URL` environment variable

### Third-Party Services
- **Railway**: Production hosting platform
  - Automated deployments
  - PostgreSQL database provisioning
  - Environment variable management

### Media Processing
- **FFmpeg**: RTSP to HLS stream conversion
  - Installed via Nix packages (`.nixpacks` configuration)
  - Real-time transcoding with ultrafast preset
  - TCP transport for RTSP reliability

### Frontend Libraries
- **Radix UI**: Accessible component primitives (@radix-ui/react-*)
- **Shadcn/UI**: Pre-built component library
- **React Query**: Server state management (@tanstack/react-query)
- **Wouter**: Lightweight routing
- **HLS.js**: Browser video playback
- **Tailwind CSS**: Utility-first styling

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across stack
- **ESBuild**: Server-side bundling for production

### Authentication
- **jsonwebtoken**: JWT creation and verification
- **bcryptjs**: Password hashing
- **cookie-parser**: HTTP-only cookie handling

### Deployment Configuration
- Nixpacks for build process (Node.js 20.x specified)
- Environment variables: `DATABASE_URL`, `NODE_ENV`, `PORT`, `SESSION_SECRET`
- Build scripts: `npm run build` → `npm start`