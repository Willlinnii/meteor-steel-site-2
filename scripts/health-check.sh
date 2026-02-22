#!/usr/bin/env bash
# =============================================================
# Mythouse Health Check — Automated Diagnostic Routine
# Run from project root: bash scripts/health-check.sh
# =============================================================

cd "$(dirname "$0")/.." || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
WARN=0
FAIL=0

pass()  { echo -e "  ${GREEN}PASS${NC}  $1"; PASS=$((PASS + 1)); }
warn()  { echo -e "  ${YELLOW}WARN${NC}  $1"; WARN=$((WARN + 1)); }
fail()  { echo -e "  ${RED}FAIL${NC}  $1"; FAIL=$((FAIL + 1)); }
header(){ echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# --- 1. Environment Variables ---
header "1. Environment Variables"

check_env() {
  local file="$1" var="$2" label="$3"
  if [ -f "$file" ] && grep -q "^${var}=" "$file" 2>/dev/null; then
    val=$(grep "^${var}=" "$file" | head -1 | cut -d= -f2-)
    if [ -z "$val" ] || [ "$val" = '""' ] || [ "$val" = "''" ]; then
      fail "$label ($var) — set but empty"
    else
      pass "$label ($var)"
    fi
  else
    fail "$label ($var) — missing from $file"
  fi
}

ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
  pass "Env file found: $ENV_FILE"
  check_env "$ENV_FILE" "REACT_APP_FIREBASE_API_KEY"           "Firebase API Key"
  check_env "$ENV_FILE" "REACT_APP_FIREBASE_AUTH_DOMAIN"       "Firebase Auth Domain"
  check_env "$ENV_FILE" "REACT_APP_FIREBASE_PROJECT_ID"        "Firebase Project ID"
  check_env "$ENV_FILE" "REACT_APP_FIREBASE_STORAGE_BUCKET"    "Firebase Storage Bucket"
  check_env "$ENV_FILE" "REACT_APP_FIREBASE_APP_ID"            "Firebase App ID"
  check_env "$ENV_FILE" "REACT_APP_ADMIN_EMAIL"                "Admin Email"
  check_env "$ENV_FILE" "REACT_APP_GOOGLE_MAPS_API_KEY"        "Google Maps API Key"
else
  fail "No .env.local or .env file found"
fi

VERCEL_ENV=".env.vercel"
if [ -f "$VERCEL_ENV" ]; then
  check_env "$VERCEL_ENV" "ANTHROPIC_API_KEY"            "Anthropic API Key"
  check_env "$VERCEL_ENV" "OPENAI_API_KEY"               "OpenAI API Key"
  check_env "$VERCEL_ENV" "FIREBASE_SERVICE_ACCOUNT_KEY" "Firebase Service Account"
else
  warn "Server-side keys (.env.vercel) — managed on Vercel, not checkable locally"
fi

# --- 2. Dependencies ---
header "2. Dependencies"

if [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
  pass "Lock file present"
else
  warn "No lock file found"
fi

if [ -d "node_modules" ]; then
  pass "node_modules installed"
else
  fail "node_modules missing — run npm install"
fi

# Check for outdated critical packages
if command -v npm &>/dev/null; then
  OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")
  CRITICAL_PKGS=("react" "firebase")
  for pkg in "${CRITICAL_PKGS[@]}"; do
    if echo "$OUTDATED" | grep -q "\"$pkg\"" 2>/dev/null; then
      CURRENT=$(echo "$OUTDATED" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$pkg',{}).get('current','?'))" 2>/dev/null || echo "?")
      LATEST=$(echo "$OUTDATED" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$pkg',{}).get('latest','?'))" 2>/dev/null || echo "?")
      warn "$pkg: $CURRENT → $LATEST available"
    else
      pass "$pkg: up to date"
    fi
  done

  # Server-side packages (may not be in local node_modules)
  SERVER_PKGS=("@anthropic-ai/sdk" "openai")
  for pkg in "${SERVER_PKGS[@]}"; do
    if [ -d "node_modules/$pkg" ]; then
      if echo "$OUTDATED" | grep -q "\"$pkg\"" 2>/dev/null; then
        warn "$pkg: update available"
      else
        pass "$pkg: up to date"
      fi
    else
      pass "$pkg: server-side only (checked on Vercel)"
    fi
  done

  # Quick vulnerability check
  AUDIT_HIGH=$(npm audit 2>/dev/null | grep -c "high\|critical" || true)
  if [ "$AUDIT_HIGH" = "0" ]; then
    pass "No high/critical vulnerabilities"
  else
    warn "npm audit found high/critical vulnerabilities — run npm audit for details"
  fi
fi

# --- 3. Build Check ---
header "3. Build"

BUILD_OUTPUT=$(CI=false npm run build 2>&1) && BUILD_EXIT=0 || BUILD_EXIT=$?
if [ $BUILD_EXIT -eq 0 ]; then
  pass "npm run build — compiled successfully"
  # Check for warnings
  WARN_COUNT=$(echo "$BUILD_OUTPUT" | grep -c "WARNING\|warning" || true)
  if [ "$WARN_COUNT" -gt 0 ]; then
    warn "$WARN_COUNT build warnings"
  fi
else
  fail "npm run build — failed (exit $BUILD_EXIT)"
  echo "$BUILD_OUTPUT" | tail -20
fi

# --- 4. API Endpoint Syntax Check ---
header "4. API Endpoints (syntax)"

API_DIR="api"
if [ -d "$API_DIR" ]; then
  for f in $(find "$API_DIR" -name "*.js" -not -path "*/node_modules/*" | sort); do
    if node --check "$f" 2>/dev/null; then
      pass "$(basename "$f")"
    else
      fail "$(basename "$f") — syntax error"
    fi
  done
else
  warn "No api/ directory found"
fi

# --- 5. External Service Connectivity ---
header "5. External Services"

check_url() {
  local url="$1" label="$2"
  local raw_code
  raw_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  # Extract just the 3-digit HTTP code
  local code="${raw_code:0:3}"
  if [ "$code" -ge 200 ] 2>/dev/null && [ "$code" -lt 400 ] 2>/dev/null; then
    pass "$label (HTTP $code)"
  elif [ "$code" = "000" ]; then
    warn "$label — connection timeout (non-critical)"
  else
    warn "$label (HTTP $code)"
  fi
}

check_url "https://worldtimeapi.org/api/ip"     "Worldtimeapi"
check_url "https://ipwho.is/"                    "ipwho.is"
check_url "https://api.anthropic.com/"           "Anthropic API (reachable)"
check_url "https://api.openai.com/v1/models"     "OpenAI API (reachable)"
check_url "https://www.youtube.com/"             "YouTube CDN"
check_url "https://en.wikisource.org/"           "Wikisource"

# --- 6. Data Files Integrity ---
header "6. Data Files"

DATA_DIR="src/data"
if [ -d "$DATA_DIR" ]; then
  JSON_COUNT=0
  JSON_BAD=0
  for f in $(find "$DATA_DIR" -name "*.json" | sort); do
    JSON_COUNT=$((JSON_COUNT + 1))
    if ! python3 -c "import json; json.load(open('$f'))" 2>/dev/null; then
      fail "Invalid JSON: $f"
      JSON_BAD=$((JSON_BAD + 1))
    fi
  done
  if [ $JSON_BAD -eq 0 ]; then
    pass "All $JSON_COUNT JSON data files valid"
  fi
else
  warn "No src/data/ directory"
fi

# --- 7. Route & Page Check ---
header "7. Pages & Routes"

PAGES=(
  "src/pages/Chronosphaera/ChronosphaeraPage.js"
  "src/pages/Games/GamesPage.js"
  "src/pages/Profile/ProfilePage.js"
  "src/pages/Admin/AdminPage.js"
  "src/pages/YellowBrickRoad/YellowBrickRoadPage.js"
  "src/pages/OuroborosJourney/OuroborosJourneyPage.js"
)
for p in "${PAGES[@]}"; do
  if [ -f "$p" ]; then
    pass "$(basename "$p")"
  else
    fail "Missing: $p"
  fi
done

# --- 8. Git Status ---
header "8. Git Status"

if git rev-parse --is-inside-work-tree &>/dev/null; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
  pass "Branch: $BRANCH"

  UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [ "$UNCOMMITTED" = "0" ]; then
    pass "Working tree clean"
  else
    warn "$UNCOMMITTED uncommitted changes"
  fi

  # Check if ahead/behind remote
  git fetch origin --quiet 2>/dev/null || true
  AHEAD=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo "?")
  BEHIND=$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo "?")
  if [ "$AHEAD" != "?" ] && [ "$BEHIND" != "?" ]; then
    if [ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ]; then
      pass "In sync with remote"
    else
      warn "Remote: $AHEAD behind, $BEHIND ahead"
    fi
  fi
else
  warn "Not a git repository"
fi

# --- 9. Common Bug Patterns ---
header "9. Code Quality Scan"

# Check for console.log in production code (excluding tests)
CONSOLE_LOGS=$(grep -rn "console\.log" src/ --include="*.js" --include="*.jsx" \
  --exclude-dir=__tests__ --exclude-dir=test 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt 50 ]; then
  warn "$CONSOLE_LOGS console.log statements in src/"
else
  pass "console.log count OK ($CONSOLE_LOGS)"
fi

# Check for TODO/FIXME/HACK comments
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODOS" -gt 0 ]; then
  warn "$TODOS TODO/FIXME/HACK comments found"
else
  pass "No TODO/FIXME/HACK comments"
fi

# Check for duplicate React imports (common CRA issue)
DUPLICATE_REACT=$(grep -rn "^import React" src/ --include="*.js" --include="*.jsx" 2>/dev/null | \
  awk -F: '{print $1}' | sort | uniq -d | wc -l | tr -d ' ')
if [ "$DUPLICATE_REACT" -gt 0 ]; then
  warn "$DUPLICATE_REACT files with duplicate React imports"
else
  pass "No duplicate React imports"
fi

# --- Summary ---
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TOTAL=$((PASS + WARN + FAIL))
echo -e "  ${GREEN}$PASS passed${NC}  ${YELLOW}$WARN warnings${NC}  ${RED}$FAIL failures${NC}  ($TOTAL checks)"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAIL -gt 0 ]; then
  exit 1
else
  exit 0
fi
