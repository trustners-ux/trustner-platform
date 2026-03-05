# TRUSTNER PARTNER OS — Claude Code Project Context

## Company & Business Context

**Company**: Trustner Asset Services Pvt Ltd (ARN 286886)
**Founder**: Ram (trustners@gmail.com)
**Business**: B2B2C Fintech Distribution Platform combining Mutual Fund distribution (via InvestWell/BSE Star MF) and Insurance Broking (via VJ Infosoft) under one unified platform
**Launch Target**: April 1, 2026 — full fintech portal go-live
**Domain**: app.trustner.in (planned)

### Business Model
- Mutual Fund: Sub-broker model under ARN 286886, onboard partners (sub-brokers) who bring clients, earn tiered trail commissions (STARTER 50% → ELITE 70%)
- Insurance: Insurance Broking entity (Trust Now Insurance Brokers), onboard POSP agents, earn slab-based commissions with IRDAI EOM compliance
- AI Advisory: Rule-based advisory engine for risk profiling, goal planning, insurance gap analysis — no external AI API dependency

### Key Regulatory Context (India)
- SEBI MF Regulations 2026 (brokerage caps 12bps→6bps)
- Insurance Laws Amendment 2025 (composite licensing, 100% FDI)
- IRDAI Bima Sugam digital marketplace
- SEBI Stock Brokers Regulations 2026 (multi-service evolution)
- GST exemption on insurance premiums

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS (TypeScript) | NestJS 10+ |
| Frontend | React + Vite + Tailwind CSS | React 18, Vite 5 |
| Database | PostgreSQL + Prisma ORM | PostgreSQL 15, Prisma 5 |
| Cache | Redis | Redis 7 |
| Mobile | Progressive Web App (PWA) | Service Worker API |
| Deployment | Docker Compose + Nginx | Docker 24+ |
| CI/CD | GitHub Actions | - |
| SSL | Let's Encrypt (Certbot) | - |

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Nginx (Port 80/443)                │
│              SSL termination + reverse proxy          │
├──────────────────┬───────────────────────────────────┤
│  React Frontend  │        NestJS Backend API         │
│  (Vite build)    │        (Port 5000)                │
│  Static files    │        /api/* proxy               │
├──────────────────┴───────────────────────────────────┤
│              Docker Compose Network                   │
├────────────────────┬─────────────────────────────────┤
│  PostgreSQL 15     │       Redis 7                   │
│  (Port 5432)       │       (Port 6379)               │
│  Primary DB        │       Cache/Sessions            │
└────────────────────┴─────────────────────────────────┘
```

## Project Structure

```
trustner-partner-os/
├── CLAUDE.md                    ← YOU ARE HERE
├── docker-compose.yml           ← Orchestration (5 services)
├── .env.example                 ← 30+ env variables template
├── architecture-diagram.html    ← Visual architecture
├── er-diagram.mermaid           ← Database ER diagram
│
├── backend/
│   ├── Dockerfile
│   ├── package.json             ← NestJS dependencies
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma        ← 2,196 lines, 60+ models, unified schema
│   └── src/
│       ├── main.ts              ← NestJS bootstrap, port 5000
│       ├── app.module.ts        ← Root module, imports all 17 feature modules
│       ├── seed.ts              ← Database seeder
│       │
│       ├── prisma/              ← PrismaService (singleton DB connection)
│       ├── auth/                ← JWT auth, Passport strategy, login/register
│       ├── users/               ← User CRUD, role management
│       ├── sub-brokers/         ← Sub-broker onboarding, tiers, documents
│       ├── clients/             ← Client management, KYC tracking
│       ├── transactions/        ← MF transactions (lumpsum, SIP, STP, SWP, switch)
│       ├── sip/                 ← SIP management, auto-debit tracking
│       ├── holdings/            ← Portfolio holdings, NAV tracking
│       ├── commissions/         ← MF commission calculation (tier-based)
│       ├── payouts/             ← Payout processing, bank transfers
│       ├── compliance/          ← SEBI/AMFI compliance tracking
│       ├── dashboard/           ← Admin + partner dashboards
│       ├── reports/             ← Report generation (AUM, commission, compliance)
│       ├── bse-integration/     ← BSE Star MF API integration
│       ├── notifications/       ← Email, SMS (MSG91), WhatsApp (Wati)
│       ├── audit/               ← Audit trail logging
│       ├── system-config/       ← System configuration management
│       │
│       ├── insurance/           ← INSURANCE BROKING MODULE
│       │   ├── insurance.module.ts      ← Aggregates all insurance sub-modules
│       │   ├── leads/                   ← Lead management, pipeline
│       │   ├── policies/                ← Policy lifecycle, renewals
│       │   ├── claims/                  ← Claim processing, tracking
│       │   ├── posp/                    ← POSP agent management
│       │   ├── commissions/             ← Insurance commission (slab-based, IRDAI)
│       │   ├── endorsements/            ← Policy endorsements
│       │   ├── renewals/                ← Renewal tracking, reminders
│       │   ├── compliance/              ← IRDAI compliance, EOM reporting
│       │   ├── inspections/             ← Motor vehicle inspections
│       │   └── tickets/                 ← Support ticket system
│       │
│       ├── ai-advisory/         ← AI ADVISORY ENGINE (rule-based, no external API)
│       │   ├── ai-advisory.module.ts
│       │   ├── ai-advisory.controller.ts  ← 10 REST endpoints
│       │   ├── dto/                        ← 5 validation DTOs
│       │   └── services/
│       │       ├── risk-profile.service.ts      ← 10-question SEBI assessment
│       │       ├── goal-planner.service.ts      ← 9 goal types, SIP formula
│       │       ├── insurance-gap.service.ts     ← Life/health/motor/CI analysis
│       │       ├── smart-recommendation.service.ts ← 17 fund categories
│       │       └── natural-query.service.ts     ← Rule-based NLP (9 intents)
│       │
│       └── common/              ← Shared utilities
│           ├── dto/             ← Pagination DTO
│           ├── filters/         ← HTTP exception filter
│           ├── interceptors/    ← Audit log, transform response
│           ├── decorators/      ← @CurrentUser(), @Roles()
│           └── guards/          ← JWT auth guard, roles guard
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json             ← React + Vite dependencies
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html               ← PWA meta tags included
│   ├── nginx.conf               ← Frontend nginx config
│   │
│   ├── public/
│   │   ├── manifest.json        ← PWA manifest (8 icon sizes)
│   │   ├── sw.js                ← Service worker (cache-first + network-first)
│   │   ├── offline.html         ← Offline fallback page
│   │   └── icons/               ← 8 PNG icons (72-512px)
│   │
│   └── src/
│       ├── main.jsx             ← React entry point
│       ├── App.jsx              ← Router + all routes (35+ routes)
│       │
│       ├── contexts/
│       │   └── AuthContext.jsx   ← Authentication state management
│       │
│       ├── layouts/
│       │   ├── UnifiedLayout.jsx ← Main sidebar layout (MF + Insurance + Advisory)
│       │   ├── AdminLayout.jsx
│       │   ├── PartnerLayout.jsx
│       │   └── ClientLayout.jsx
│       │
│       ├── components/
│       │   ├── PWAInstallPrompt.jsx  ← Install banner
│       │   ├── OfflineIndicator.jsx  ← Offline status bar
│       │   ├── MobileNav.jsx         ← 5-tab bottom navigation
│       │   ├── PullToRefresh.jsx     ← Touch pull-to-refresh
│       │   ├── ProtectedRoute.jsx
│       │   ├── charts/              ← Area, Bar, Line, Pie charts
│       │   └── common/              ← DataTable, Modal, StatCard, etc.
│       │
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── UnifiedDashboard.jsx
│       │   ├── admin/               ← 8 admin pages
│       │   ├── partner/             ← 7 partner pages
│       │   ├── client/              ← 5 client pages
│       │   ├── mf/                  ← Fund explorer, SIP calc, comparison
│       │   ├── insurance/           ← 15 insurance pages
│       │   └── advisory/            ← 6 AI advisory pages
│       │
│       ├── services/
│       │   ├── api.js               ← Axios instance + interceptors
│       │   └── auth.js              ← Auth API calls
│       │
│       ├── hooks/
│       │   └── useMediaQuery.js     ← 10 responsive hooks
│       │
│       └── utils/
│           ├── constants.js
│           ├── formatters.js        ← Currency, date, percentage formatters
│           └── pwa.js               ← 12 PWA utility functions
│
├── nginx/
│   └── (nginx configs for production)
│
└── scripts/
    ├── deploy.sh                ← Full deployment script
    ├── backup.sh                ← Database backup automation
    ├── setup-ssl.sh             ← Let's Encrypt SSL setup
    └── monitor.sh               ← Health monitoring script
```

## Database Schema (Prisma)

The unified schema at `backend/prisma/schema.prisma` contains 60+ models organized in sections:

### User Roles (7 roles)
`SUPER_ADMIN`, `COMPLIANCE_ADMIN`, `FINANCE_ADMIN`, `REGIONAL_HEAD`, `SUB_BROKER`, `CLIENT`, `POSP`

### Key Models by Module

**MF Module**: User, SubBroker, SubBrokerTier, Client, KYCRecord, Transaction, SIP, Holding, NAVData, Commission, Payout, Fund, FundScheme, AMC, ComplianceRecord, AuditLog, Notification, SystemConfig, Report

**Insurance Module**: InsurancePolicy, InsuranceClaim, InsuranceLead, POSPAgent, InsuranceCommission, PolicyEndorsement, RenewalTracker, InsuranceCompany, InsuranceProduct, MotorInspection, SupportTicket

**AI Advisory**: Uses existing models (User, Client) — no separate tables needed (computations are stateless/rule-based)

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — JWT login
- `POST /api/auth/refresh` — Refresh token

### MF Module
- `/api/sub-brokers` — CRUD, tier management
- `/api/clients` — CRUD, KYC tracking
- `/api/transactions` — MF buy/sell/SIP/STP/SWP
- `/api/sip` — SIP management
- `/api/holdings` — Portfolio holdings
- `/api/commissions` — Commission calculations
- `/api/payouts` — Payout processing
- `/api/dashboard` — Dashboard analytics
- `/api/reports` — Report generation
- `/api/bse` — BSE Star MF integration

### Insurance Module
- `/api/insurance/leads` — Lead pipeline
- `/api/insurance/policies` — Policy lifecycle
- `/api/insurance/claims` — Claim processing
- `/api/insurance/posp` — POSP management
- `/api/insurance/commissions` — Insurance commissions
- `/api/insurance/endorsements` — Policy changes
- `/api/insurance/renewals` — Renewal tracking
- `/api/insurance/compliance` — IRDAI compliance
- `/api/insurance/inspections` — Motor inspections
- `/api/insurance/tickets` — Support tickets

### AI Advisory
- `POST /api/advisory/risk-profile` — SEBI risk assessment
- `POST /api/advisory/goal-plan` — Goal-based SIP planning
- `POST /api/advisory/insurance-gap` — Insurance gap analysis
- `POST /api/advisory/smart-recommend` — MF + Insurance recommendations
- `POST /api/advisory/query` — Natural language query
- `GET  /api/advisory/risk-questions` — Get assessment questions
- `GET  /api/advisory/goal-types` — Get available goal types
- `GET  /api/advisory/fund-categories` — Get fund categories
- `POST /api/advisory/comprehensive-plan` — Full financial plan
- `GET  /api/advisory/dashboard/:clientId` — Client advisory dashboard

## Frontend Routes

| Path | Component | Module |
|------|-----------|--------|
| `/` | UnifiedDashboard | Dashboard |
| `/mf/dashboard` | UnifiedDashboard | MF |
| `/mf/explorer` | FundExplorer | MF |
| `/mf/sip-calculator` | SIPCalculator | MF |
| `/mf/compare` | MFPerformanceComparison | MF |
| `/insurance/dashboard` | IBDashboard | Insurance |
| `/insurance/leads` | LeadsPage | Insurance |
| `/insurance/leads/:id` | LeadDetail | Insurance |
| `/insurance/policies` | PoliciesPage | Insurance |
| `/insurance/policies/:id` | PolicyDetail | Insurance |
| `/insurance/claims` | ClaimsPage | Insurance |
| `/insurance/claims/:id` | ClaimDetail | Insurance |
| `/insurance/endorsements` | EndorsementsPage | Insurance |
| `/insurance/renewals` | RenewalsPage | Insurance |
| `/insurance/posp` | POSPManagement | Insurance |
| `/insurance/posp/:id` | POSPDetail | Insurance |
| `/insurance/commissions` | IBCommissionPage | Insurance |
| `/insurance/tickets` | TicketsPage | Insurance |
| `/insurance/tickets/:id` | TicketDetail | Insurance |
| `/insurance/reports` | IBReportsPage | Insurance |
| `/insurance/inspections` | InspectionPage | Insurance |
| `/advisory` | AdvisoryDashboard | AI Advisory |
| `/advisory/risk-assessment` | RiskAssessment | AI Advisory |
| `/advisory/goal-planner` | GoalPlanner | AI Advisory |
| `/advisory/insurance-gap` | InsuranceGapAnalysis | AI Advisory |
| `/advisory/smart-recommend` | SmartRecommendations | AI Advisory |
| `/advisory/chat` | AdvisoryChat | AI Advisory |

## External Integrations (configured via .env)

| Service | Purpose | Status |
|---------|---------|--------|
| BSE Star MF | MF transactions | API keys needed |
| Razorpay | Payment gateway | API keys needed |
| MSG91 | SMS OTP | API key needed |
| Gmail SMTP | Email notifications | Configured |
| Wati/AiSensy | WhatsApp Business | API key needed |
| DigiLocker | eKYC verification | Client ID needed |
| VJ Infosoft | Insurance API | Credentials needed |
| DigitalOcean | Server hosting | Account needed |
| S3/DO Spaces | File storage | Keys needed |

## Development Commands

```bash
# Backend
cd backend
npm install
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations
npx prisma db seed           # Seed database
npm run start:dev            # Start dev server (port 5000)

# Frontend
cd frontend
npm install
npm run dev                  # Start Vite dev server (port 3000)
npm run build               # Production build

# Docker (full stack)
docker-compose up -d                  # Start all services
docker-compose --profile dev up -d    # Include Adminer
docker-compose down                   # Stop all

# Deployment
./scripts/deploy.sh          # Full production deployment
./scripts/backup.sh          # Database backup
./scripts/setup-ssl.sh       # SSL certificate setup
./scripts/monitor.sh         # Health check
```

## Coding Conventions

- **Backend**: NestJS module pattern (module → controller → service → DTO)
- **Frontend**: React functional components with hooks, lazy loading for all pages
- **Styling**: Tailwind CSS utility classes, navy (#0D1B3E) + gold (#D4A843) brand colors
- **API calls**: Axios instance with JWT interceptors (frontend/src/services/api.js)
- **Auth**: JWT Bearer token, stored in localStorage, auto-refresh
- **Guards**: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`
- **Validation**: class-validator decorators in DTOs
- **Color theme sections**: teal (MF), orange (Insurance), purple (AI Advisory) in sidebar

## Current Status (March 1, 2026)

- **Code**: 194 files, ~36,600 lines — COMPLETE and validated
- **Deployment**: Not yet deployed — needs DigitalOcean server
- **External APIs**: Credentials not yet obtained
- **Testing**: Syntax validated, needs runtime testing after deployment

## Important Notes for Claude Code

1. **Prisma schema** is the source of truth for all database models. Always run `npx prisma generate` after schema changes.
2. **All backend modules** follow the same pattern: `*.module.ts` → `*.controller.ts` → `*.service.ts` → `dto/*.dto.ts`
3. **Insurance module** has sub-modules nested under `src/insurance/`
4. **AI Advisory** is entirely rule-based — no OpenAI/external AI calls. All calculations happen server-side.
5. **PWA service worker** (`public/sw.js`) uses cache-first for static assets and network-first for API calls.
6. **Docker Compose** expects a `.env` file — copy from `.env.example` and fill in credentials.
7. **The sidebar** in `UnifiedLayout.jsx` has three color-coded sections: teal (MF), orange (Insurance), purple (Advisory)
8. **Indian regulatory compliance** is critical — all commission calculations must respect SEBI/IRDAI rules.

## Board Documents (reference)

Located in the parent folder (not in this repo):
- `Trustner_Board_Presentation_Combined_Vision.pptx` — 13-slide board deck
- `Trustner_Board_WriteUp_Combined_Vision.docx` — Detailed board write-up (11 sections)
- `Trustner_Deployment_Guide_Production.docx` — Step-by-step deployment guide
- `Trustner_Project_Tracker.xlsx` — 53-task project tracker (4 sheets)
