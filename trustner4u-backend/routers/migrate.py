"""
Temporary Migration Router — Runs SQL migrations against Supabase PostgreSQL.
Uses httpx to POST SQL to Supabase's internal endpoints.
DELETE THIS FILE after migrations are complete.
"""

import os
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
MIGRATION_DIR = Path(__file__).parent.parent / "migrations"


def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


@router.get("/list-migrations")
async def list_migrations():
    """List available migration files."""
    files = sorted(MIGRATION_DIR.glob("*.sql"))
    return {"migrations": [f.name for f in files]}


@router.get("/migration-sql/{migration_name}")
async def get_migration_sql(migration_name: str):
    """Get the SQL content of a migration file."""
    filename = f"{migration_name}.sql"
    filepath = MIGRATION_DIR / filename
    if not filepath.exists():
        available = [f.name for f in MIGRATION_DIR.glob("*.sql")]
        raise HTTPException(404, f"Not found. Available: {available}")
    return {"migration": filename, "sql": filepath.read_text(), "length": len(filepath.read_text())}


@router.post("/run-migration/{migration_name}")
async def run_migration(migration_name: str, secret: str = ""):
    """
    Run a migration. Pass ?secret=<SUPABASE_SERVICE_KEY> for auth.
    Tries multiple Supabase SQL execution methods.
    """
    if secret != SUPABASE_KEY or not SUPABASE_KEY:
        raise HTTPException(403, "Invalid secret")

    filename = f"{migration_name}.sql"
    filepath = MIGRATION_DIR / filename
    if not filepath.exists():
        available = [f.name for f in MIGRATION_DIR.glob("*.sql")]
        raise HTTPException(404, f"Not found. Available: {available}")

    sql = filepath.read_text()
    ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
    errors = []

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Method 1: Supabase pg-meta /query endpoint
        try:
            resp = await client.post(
                f"https://{ref}.supabase.co/pg/query",
                headers=_headers(),
                json={"query": sql},
            )
            if resp.status_code < 300:
                return {"migration": filename, "method": "pg-meta", "status": "success", "response": resp.text[:500]}
            errors.append(f"pg-meta: {resp.status_code} {resp.text[:300]}")
        except Exception as e:
            errors.append(f"pg-meta: {e}")

        # Method 2: Supabase /rest/v1/rpc with raw query
        try:
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                headers=_headers(),
                json={"query": sql},
            )
            if resp.status_code < 300:
                return {"migration": filename, "method": "rpc-exec", "status": "success"}
            errors.append(f"rpc-exec: {resp.status_code} {resp.text[:300]}")
        except Exception as e:
            errors.append(f"rpc-exec: {e}")

        # Method 3: Execute statements one by one via PostgREST
        # Split SQL and try each CREATE TABLE/INSERT separately
        stmts = _split_sql(sql)
        success_count = 0
        stmt_errors = []

        for i, stmt in enumerate(stmts):
            try:
                # Try pg-meta for each statement
                resp = await client.post(
                    f"https://{ref}.supabase.co/pg/query",
                    headers=_headers(),
                    json={"query": stmt},
                )
                if resp.status_code < 300:
                    success_count += 1
                else:
                    stmt_errors.append({"stmt": i + 1, "preview": stmt[:80], "error": resp.text[:200]})
            except Exception as e:
                stmt_errors.append({"stmt": i + 1, "preview": stmt[:80], "error": str(e)})

        if success_count > 0:
            return {
                "migration": filename,
                "method": "pg-meta-individual",
                "total_statements": len(stmts),
                "success": success_count,
                "errors": stmt_errors,
            }

    return {
        "migration": filename,
        "status": "all_methods_failed",
        "errors": errors,
        "hint": "Run the SQL manually: GET /api/migrate/migration-sql/" + migration_name,
    }


@router.post("/run-sql")
async def run_sql_endpoint(sql: str = "", secret: str = ""):
    """Run a single SQL statement. For debugging."""
    if secret != SUPABASE_KEY or not SUPABASE_KEY:
        raise HTTPException(403, "Invalid secret")
    if not sql:
        raise HTTPException(400, "No SQL provided")

    ref = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"https://{ref}.supabase.co/pg/query",
            headers=_headers(),
            json={"query": sql},
        )
        return {"status_code": resp.status_code, "response": resp.text[:1000]}


def _split_sql(sql: str) -> list[str]:
    """Split SQL into individual statements."""
    statements = []
    current = []
    in_dollar_quote = False

    for line in sql.split('\n'):
        stripped = line.strip()
        if stripped.startswith('--') or stripped == '':
            continue

        # Track $$ dollar quoting (for INSERT with JSON etc)
        if '$$' in stripped:
            in_dollar_quote = not in_dollar_quote

        current.append(line)

        if stripped.endswith(';') and not in_dollar_quote:
            stmt = '\n'.join(current).strip()
            if stmt and stmt != ';':
                statements.append(stmt)
            current = []

    if current:
        stmt = '\n'.join(current).strip()
        if stmt:
            statements.append(stmt)

    return statements
