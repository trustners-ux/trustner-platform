"""Trustner4u MIS Platform — FastAPI Backend Entry Point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import cas, reports, portfolio, auth, nav, review, mis_data  # noqa: E402
from routers.employees import router as employees_router  # noqa: E402
from routers.business import router as business_router  # noqa: E402
from routers.incentive import router as incentive_router  # noqa: E402
from routers.admin_controls import router as admin_controls_router  # noqa: E402
from routers.migrate import router as migrate_router  # noqa: E402

app = FastAPI(
    title="Trustner4u MIS API",
    description="MIS Backend — Trustner Asset Services Pvt. Ltd.",
    version="1.0.0",
)

# CORS
origins = [
    "https://trustner4u.com",
    "https://www.trustner4u.com",
    "https://trustner4u.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(cas.router, prefix="/api", tags=["CAS Parser"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio & Clients"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(nav.router, prefix="/api", tags=["NAV"])
app.include_router(review.router, prefix="/api/review", tags=["Review Workflow"])
app.include_router(employees_router, prefix="/api/employees", tags=["employees"])
app.include_router(mis_data.router)  # prefix /api/mis defined in router
app.include_router(business_router, prefix="/api/business", tags=["Business Entries"])
app.include_router(incentive_router, prefix="/api/incentive", tags=["Incentive Calculation"])
app.include_router(admin_controls_router, prefix="/api/admin", tags=["Admin Controls"])
app.include_router(migrate_router, prefix="/api/migrate", tags=["Migration (Temp)"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "trustner4u-api", "arn": "ARN-286886"}


@app.get("/")
async def root():
    return {
        "service": "Trustner4u MIS API",
        "company": "Trustner Asset Services Pvt. Ltd.",
        "arn": "ARN-286886",
        "version": "1.0.0",
    }
