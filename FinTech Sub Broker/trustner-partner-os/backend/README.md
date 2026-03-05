# Trustner Partner OS - Backend

**B2B2C Fintech Distribution Platform**

Production-quality NestJS backend for managing sub-broker operations, client portfolios, commission calculations, and financial transactions.

## 🏗️ Architecture

- **Framework**: NestJS 10.3.7
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger/OpenAPI
- **Real-time**: WebSocket ready (extensible)
- **Fintech Grade**: Decimal precision, audit logging, TDS/GST calculations

## 📦 Core Modules

### Authentication & Security
- `auth/` - JWT authentication, role-based access control
- `common/guards/` - JwtAuthGuard, RolesGuard
- `common/decorators/` - @Roles(), @CurrentUser()
- `common/filters/` - Global error handling
- `common/interceptors/` - Audit logging, response transformation

### Sub-Broker Management
- `sub-brokers/` - Registration, KYC, approval workflow, performance metrics
- Tier management (STARTER, GROWTH, SENIOR, ELITE)
- Revenue share calculations

### Client Management
- `clients/` - Client profiles, KYC, risk assessment, portfolio tracking
- Linked to sub-brokers for multi-level distribution

### Investment Operations
- `transactions/` - Lumpsum, SIP, Redemption, Switch, STP, SWP
- `sip/` - SIP mandate management
- `holdings/` - Portfolio holdings and valuation

### Commission Engine (Heart of System)
- `commissions/` - THE CRITICAL MODULE
  - RTA file imports (CAMS, KFINTECH, FRANKLIN, SBICAP)
  - Commission calculation with TDS/GST
  - Revenue share split (STARTER 50%, GROWTH 60%, SENIOR 65%, ELITE 70%)
  - Clawback processing
  - Trail forecasting

### Payout Management
- `payouts/` - Payout generation, approval, payment processing
- Excel/PDF export for financial statements
- Banking integration ready

### Compliance & Audit
- `compliance/` - Compliance alerts, expiry tracking
- `audit/` - Comprehensive audit logging for all state-changing operations

### Reporting
- `dashboard/` - Analytics dashboards for different user roles
- `reports/` - MIS reports, capital gain statements, performance reports

### Integrations
- `bse-integration/` - BSE Star MF API integration (ready for credentials)
- `notifications/` - Email, SMS, WhatsApp, in-app notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

### Development

```bash
# Start dev server with hot reload
npm run start:dev

# Watch mode
npm run start:watch

# Access API documentation
http://localhost:5000/api/docs
```

### Production

```bash
# Build
npm run build

# Start
npm run start:prod
```

## 📊 Database Schema

17+ modules with 30+ models:
- User (6 roles: SUPER_ADMIN, COMPLIANCE_ADMIN, FINANCE_ADMIN, REGIONAL_HEAD, SUB_BROKER, CLIENT)
- SubBroker (with AUM tracking, tier management)
- Client (with KYC tracking, risk profiles)
- Transaction (LUMPSUM, SIP, REDEEM, SWITCH, STP, SWP)
- Commission (with TDS/GST calculations)
- Payout (approval workflow)
- SIPMandate (with mandate tracking)
- Scheme (with commission rates)
- Holding (with valuation)
- AuditLog (comprehensive logging)
- ComplianceAlert
- SystemConfig
- And more...

See `prisma/schema.prisma` for complete schema.

## 🔐 Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Helmet security headers
- CORS configuration
- Rate limiting (100 req/min by default)
- Input validation with class-validator
- Parameterized queries (Prisma)
- Password hashing (bcryptjs, 12 rounds)
- Account lockout after failed attempts
- Audit logging for compliance

## 💰 Commission Engine

The commissions service is the core of the system:

```
RTA File Import → Transaction Mapping → Commission Calculation
                        ↓
                    Apply Rates
                        ↓
                    Calculate TDS (5% above 15K/year)
                        ↓
                    Calculate GST (18%)
                        ↓
                    Apply Revenue Share (by tier)
                        ↓
                    Create Commission Record
                        ↓
                    Generate Payouts
                        ↓
                    Export for Payment
```

Revenue Share Tiers:
- STARTER (AUM < 1Cr): 50%
- GROWTH (1-5Cr): 60%
- SENIOR (5-25Cr): 65%
- ELITE (>25Cr): 70%

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Current user profile
- `POST /auth/change-password` - Change password

### Sub-Brokers
- `GET /sub-brokers` - List with filters
- `POST /sub-brokers` - Create new
- `GET /sub-brokers/:id` - Get details
- `PATCH /sub-brokers/:id` - Update
- `POST /sub-brokers/:id/approve` - Approve
- `POST /sub-brokers/:id/suspend` - Suspend
- `GET /sub-brokers/:id/performance` - Performance metrics

### Commissions
- `POST /commissions/import-rta` - Import RTA file
- `POST /commissions/calculate` - Calculate for period
- `GET /commissions/statement/:subBrokerId` - Get statement
- `GET /commissions/forecast/:subBrokerId` - Trail forecast
- `POST /commissions/:id/clawback` - Process clawback

### Payouts
- `GET /payouts` - List all
- `POST /payouts/generate` - Generate for period
- `POST /payouts/:id/approve` - Approve
- `POST /payouts/:id/paid` - Mark as paid
- `GET /payouts/:id/statement` - Get statement

### Dashboard
- `GET /dashboard/admin` - Admin dashboard
- `GET /dashboard/partner` - Sub-broker dashboard
- `GET /dashboard/client` - Client dashboard
- `GET /dashboard/leaderboard` - Performance leaderboard

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

## 📝 Logging

- Structured logging with Winston ready
- Audit trail for all state-changing operations
- Request/response logging in development
- Error stack traces in logs

## 🐳 Docker

```bash
# Build image
docker build -t trustner-partner-os-backend .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  trustner-partner-os-backend
```

## 🔄 Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# View studio
npm run prisma:studio

# Reset (development only)
npm run prisma:reset
```

## 📋 User Roles

| Role | Permissions |
|------|------------|
| **SUPER_ADMIN** | Full system access, user management, configuration |
| **COMPLIANCE_ADMIN** | Sub-broker approval, KYC verification, alerts |
| **FINANCE_ADMIN** | Commission calculation, payouts, financial reports |
| **REGIONAL_HEAD** | Manage regional sub-brokers, performance tracking |
| **SUB_BROKER** | Client management, commission statements, SIPs |
| **CLIENT** | View portfolio, transactions, goals |

## 🛠️ Development Standards

- TypeScript with strict mode enabled
- ESLint for code quality
- Prettier for formatting
- NestJS best practices
- Comprehensive error handling
- Input validation on all endpoints
- Swagger documentation for all routes
- Unit tests for services

## 📚 Key Files

- `main.ts` - Application bootstrap
- `app.module.ts` - Root module with all imports
- `prisma/prisma.service.ts` - Database service
- `auth/auth.service.ts` - Authentication logic
- `commissions/commissions.service.ts` - Commission engine
- `common/guards/jwt-auth.guard.ts` - JWT validation
- `common/guards/roles.guard.ts` - RBAC
- `seed.ts` - Database seeding script

## 🚨 Important Notes

- All monetary calculations use Decimal for precision
- TDS is 5% on commissions above 15K per financial year
- GST is 18% on gross commission
- Audit logging captures all POST/PUT/PATCH/DELETE operations
- Rate limiting is 100 requests per minute
- JWT tokens expire in 1 hour (access) and 7 days (refresh)

## 🔗 BSE Integration

The BSE integration service is structured and ready for API credentials:
- All method signatures defined
- Proper error handling in place
- Retry logic structure prepared
- TODO comments for implementation steps

Provide BSE credentials in `.env` to activate:
```
BSE_API_URL=https://api.bseindia.com/BseStarMF/
BSE_USER_ID=your_user_id
BSE_PASSWORD=your_password
BSE_MEMBER_CODE=your_member_code
```

## 📞 Support

For issues or questions about the architecture, refer to:
- NestJS docs: https://docs.nestjs.com
- Prisma docs: https://www.prisma.io/docs
- BSE Star MF API documentation

---

**Built with ❤️ for fintech excellence. Every line matters.**
