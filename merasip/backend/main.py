"""MeraSIP S.M.A.R.T Platform — FastAPI Backend Entry Point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import cas, reports, portfolio, auth, nav, review  # noqa: E402

app = FastAPI(
    title="MeraSIP S.M.A.R.T API",
    description="Systematic Monitoring And Rebalancing Tool — Trustner Asset Services Pvt. Ltd.",
    version="1.0.0",
)

# CORS
origins = [
    "https://merasip.com",
    "https://www.merasip.com",
    "https://review.merasip.com",
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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "merasip-api", "arn": "ARN-286886"}


@app.get("/")
async def root():
    return {
        "service": "MeraSIP S.M.A.R.T API",
        "company": "Trustner Asset Services Pvt. Ltd.",
        "arn": "ARN-286886",
        "version": "1.0.0",
    }
