# MeraSIP S.M.A.R.T Platform

**Systematic Monitoring And Rebalancing Tool**
by Trustner Asset Services Pvt. Ltd. | ARN-286886

## Architecture

```
merasip/
├── backend/          Python FastAPI (Render.com)
├── frontend/         React + Vite (Vercel)
└── supabase/         Database schema (Supabase)
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### Database

Run `supabase/schema.sql` in your Supabase SQL editor.

## Environment Variables

| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_KEY | Supabase service role key |
| SUPABASE_STORAGE_BUCKET | Storage bucket name (default: reports) |
| BREVO_API_KEY | Brevo email API key |
| INTERAKT_API_KEY | Interakt WhatsApp API key |
| SECRET_KEY | JWT signing secret |
| VITE_API_URL | Backend URL for frontend (production only) |

## Deployment

- **Backend**: Deploy `backend/` to Render.com using `render.yaml`
- **Frontend**: Deploy `frontend/` to Vercel, set `VITE_API_URL` to Render URL
- **DNS**: Add CNAME `review` -> `cname.vercel-dns.com` on merasip.com

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/parse-cas | None | Parse CAS PDF |
| POST | /api/generate-report | Bearer | Generate PDF report |
| POST | /api/generate-report/email | Bearer | Email report |
| POST | /api/generate-report/whatsapp | Bearer | WhatsApp report |
| GET | /api/clients | Bearer | List clients |
| POST | /api/clients | Bearer | Create client |
| GET | /api/clients/:id/portfolio | Bearer | Get portfolio |
| GET | /api/reports/:client_id | Bearer | List reports |
| GET | /api/nav/:scheme_code | None | Live NAV |
| POST | /api/auth/advisor-login | None | Send OTP |
| POST | /api/auth/verify-otp | None | Verify OTP |
| POST | /api/review/submit | None | Submit for review |
| GET | /api/review/queue | Manager | Review queue |
| PATCH | /api/review/queue/:id | Manager | Update review |

## Compliance

- ARN-286886 displayed on every page
- EUIN: E092119 on all reports
- AMFI disclaimer on all pages
- Commission disclosure on reports
- DPDP Act 2023 compliant (CAS PDFs deleted immediately)
- Privacy Policy at /privacy
- Terms of Use at /terms
