#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# check-prod-env.sh — pre-deploy env-var sanity check
#
# Compares the env vars required by the codebase (declared in
# src/lib/config/required-env.ts) against what's actually set on
# the configured Vercel project. Exits 0 if everything's in place,
# non-zero if anything is missing or malformed.
#
# Usage:
#   ./scripts/check-prod-env.sh                # checks 'merasip' (default)
#   ./scripts/check-prod-env.sh sip-platform    # checks named project
#
# Designed to be run BEFORE pushing to main (or in CI). Catches the
# silent-failure class of bugs where Vercel ends up missing a critical
# env var (e.g. by mistake during project setup) and the bug only
# surfaces in production when a user clicks a button.
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT="${1:-merasip}"

echo "▶ Checking Vercel project: $PROJECT (production environment)"
echo

# Required vars — must match src/lib/config/required-env.ts
CRITICAL_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  JWT_SECRET
  ADMIN_USERS
)
NON_CRITICAL_VARS=(
  RM_JWT_SECRET
  OPENAI_API_KEY
  RESEND_API_KEY
  BLOB_READ_WRITE_TOKEN
  CRON_SECRET
)

# Create a temp dir linked to the target project
WORKDIR=$(mktemp -d)
trap "rm -rf $WORKDIR" EXIT
cd "$WORKDIR"

echo "  Linking to project '$PROJECT'..."
npx --yes vercel@latest link --project "$PROJECT" --yes >/dev/null 2>&1

echo "  Pulling production env list..."
npx --yes vercel@latest env pull --environment=production .env.check >/dev/null 2>&1

# Extract var names from the dotenv file
SET_VARS=$(grep -E "^[A-Z][A-Z0-9_]*=" .env.check | cut -d= -f1 || true)

# Check critical
CRITICAL_MISSING=()
CRITICAL_MALFORMED=()
for VAR in "${CRITICAL_VARS[@]}"; do
  if ! echo "$SET_VARS" | grep -qx "$VAR"; then
    CRITICAL_MISSING+=("$VAR")
    continue
  fi
  # Pull the value and check for whitespace/newline contamination
  VAL=$(grep -E "^${VAR}=" .env.check | head -1)
  if echo "$VAL" | grep -qE '\\n"|\\r"|\\t"'; then
    CRITICAL_MALFORMED+=("$VAR (contains literal \\n / \\r / \\t)")
  fi
done

# Check non-critical
NON_CRITICAL_MISSING=()
for VAR in "${NON_CRITICAL_VARS[@]}"; do
  if ! echo "$SET_VARS" | grep -qx "$VAR"; then
    NON_CRITICAL_MISSING+=("$VAR")
  fi
done

# Report
echo
if [ ${#CRITICAL_MISSING[@]} -eq 0 ] && [ ${#CRITICAL_MALFORMED[@]} -eq 0 ]; then
  echo "  ✓ All ${#CRITICAL_VARS[@]} critical env vars are set on '$PROJECT'."
else
  echo "  ✗ CRITICAL ISSUES on '$PROJECT':"
  for v in "${CRITICAL_MISSING[@]}"; do echo "      MISSING: $v"; done
  for v in "${CRITICAL_MALFORMED[@]}"; do echo "      MALFORMED: $v"; done
  echo
  echo "  Fix: vercel env add <NAME> production --value '<value>' --no-sensitive -y"
  echo "  Then redeploy: vercel --prod"
  exit 1
fi

if [ ${#NON_CRITICAL_MISSING[@]} -gt 0 ]; then
  echo
  echo "  ℹ Non-critical (optional) vars missing — some features will be degraded:"
  for v in "${NON_CRITICAL_MISSING[@]}"; do echo "      - $v"; done
fi

echo
echo "  Done. Safe to deploy."
exit 0
