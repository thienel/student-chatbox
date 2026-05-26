#!/usr/bin/env bash
# Happy-case curl test for all EduChat API endpoints
# Usage: BASE_URL=http://168.144.43.56 bash scripts/test-happy-case.sh

BASE="${BASE_URL:-http://localhost:3000}/api/v1"
PASS=0; FAIL=0

green='\033[0;32m'; red='\033[0;31m'; yellow='\033[1;33m'; cyan='\033[0;36m'; reset='\033[0m'

section() { echo -e "\n${cyan}══ $* ══${reset}"; }
ok()      { echo -e "  ${green}✓${reset} $*"; PASS=$((PASS+1)); }
fail()    { echo -e "  ${red}✗${reset} $*"; FAIL=$((FAIL+1)); }

# Temp files that persist across subshells
_STATUS=$(mktemp); _BODY=$(mktemp)
trap 'rm -f "$_STATUS" "$_BODY"' EXIT

# api METHOD PATH [curl-args...]
# writes body to $_BODY and http_code to $_STATUS
api() {
  local method="$1" path="$2"; shift 2
  curl -s -o "$_BODY" -w "%{http_code}" -X "$method" "${BASE}${path}" "$@" > "$_STATUS"
}

# check NAME EXPECTED METHOD PATH [curl-args...]
# prints pass/fail, returns 0 always
check() {
  local name="$1" expected="$2"; shift 2
  api "$@"
  local status; status=$(cat "$_STATUS")
  if [ "$status" = "$expected" ]; then
    ok "$name (HTTP $status)"
  else
    fail "$name — expected HTTP $expected, got $status"
    echo "    body: $(head -c 300 "$_BODY")"
  fi
}

# read body after check/api
body() { cat "$_BODY"; }

# jq or grep fallback extraction: jval KEY (last path segment used for grep)
jval() {
  local key="$1"
  if command -v jq &>/dev/null; then
    jq -r "$key" < "$_BODY" 2>/dev/null
  else
    local leaf="${key##*.}"; leaf="${leaf//[\[\]]/}"
    grep -o "\"${leaf}\":\"[^\"]*\"" "$_BODY" | head -1 | sed 's/.*":"//' | tr -d '"'
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
section "1. Health"
check "GET /health" 200 GET /health

# ─────────────────────────────────────────────────────────────────────────────
section "2. Auth"
check "POST /auth/login (admin)" 200 \
  POST /auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@educhat.local","password":"Admin@123456"}'

ADMIN_TOKEN=$(jval '.data.accessToken')
ADMIN_REFRESH=$(jval '.data.refreshToken')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo -e "${red}FATAL: no admin token — is seed complete?${reset}"
  body
  exit 1
fi

H_AUTH="Authorization: Bearer $ADMIN_TOKEN"

check "GET /auth/me" 200 \
  GET /auth/me -H "$H_AUTH"

check "POST /auth/refresh" 200 \
  POST /auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$ADMIN_REFRESH\"}"
NEW_REFRESH=$(jval '.data.refreshToken')

# ─────────────────────────────────────────────────────────────────────────────
section "3. Users"
TS=$(date +%s)

check "POST /users (lecturer)" 201 \
  POST /users -H "$H_AUTH" -H "Content-Type: application/json" \
  -d "{\"email\":\"lect_${TS}@test.local\",\"temporaryPassword\":\"Pass@1234\",\"fullName\":\"Test Lecturer\",\"role\":\"lecturer\"}"
LECT_ID=$(jval '.data.id')

check "POST /users (student)" 201 \
  POST /users -H "$H_AUTH" -H "Content-Type: application/json" \
  -d "{\"email\":\"stu_${TS}@test.local\",\"temporaryPassword\":\"Pass@1234\",\"fullName\":\"Test Student\",\"role\":\"student\"}"
STU_ID=$(jval '.data.id')

check "GET /users" 200 \
  GET /users -H "$H_AUTH"

check "GET /users/:id" 200 \
  GET "/users/$LECT_ID" -H "$H_AUTH"

check "PATCH /users/:id" 200 \
  PATCH "/users/$LECT_ID" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"fullName":"Updated Lecturer"}'

check "PATCH /users/:id/status (suspend)" 200 \
  PATCH "/users/$STU_ID/status" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"status":"suspended","reason":"test"}'

check "PATCH /users/:id/status (activate)" 200 \
  PATCH "/users/$STU_ID/status" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"status":"active"}'

check "POST /users/:id/reset-password" 200 \
  POST "/users/$STU_ID/reset-password" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"newPassword":"NewPass@1234"}'

# ─────────────────────────────────────────────────────────────────────────────
section "4. Subjects"

check "POST /subjects" 201 \
  POST /subjects -H "$H_AUTH" -H "Content-Type: application/json" \
  -d "{\"code\":\"CS${TS}\",\"name\":\"Test Subject\",\"description\":\"A test course\"}"
SUBJ_ID=$(jval '.data.id')

check "GET /subjects" 200 \
  GET /subjects -H "$H_AUTH"

check "GET /subjects/:id" 200 \
  GET "/subjects/$SUBJ_ID" -H "$H_AUTH"

check "PATCH /subjects/:id" 200 \
  PATCH "/subjects/$SUBJ_ID" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"description":"Updated desc"}'

check "POST /subjects/:id/lecturers" 200 \
  POST "/subjects/$SUBJ_ID/lecturers" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d "{\"lecturerId\":\"$LECT_ID\"}"

# Student enroll/unenroll
api POST /auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"stu_${TS}@test.local\",\"password\":\"NewPass@1234\"}"
STU_TOKEN=$(jval '.data.accessToken')
H_STU="Authorization: Bearer $STU_TOKEN"

if [ -n "$STU_TOKEN" ] && [ "$STU_TOKEN" != "null" ]; then
  check "POST /subjects/:id/enroll" 200 \
    POST "/subjects/$SUBJ_ID/enroll" -H "$H_STU"

  check "DELETE /subjects/:id/enroll" 204 \
    DELETE "/subjects/$SUBJ_ID/enroll" -H "$H_STU"

  # re-enroll for later tests
  curl -s -o /dev/null -X POST "${BASE}/subjects/${SUBJ_ID}/enroll" -H "$H_STU"
else
  fail "Student login failed — skipping enroll tests"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "5. Documents"

TMPFILE=$(mktemp /tmp/ecdoc_XXXXXX.pdf)
# Minimal valid PDF content
printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%%%EOF\n' > "$TMPFILE"

check "POST /subjects/:subjectId/documents" 202 \
  POST "/subjects/$SUBJ_ID/documents" -H "$H_AUTH" \
  -F "file=@${TMPFILE};type=application/pdf"
DOC_ID=$(jval '.data.id')
rm -f "$TMPFILE"

check "GET /subjects/:subjectId/documents" 200 \
  GET "/subjects/$SUBJ_ID/documents" -H "$H_AUTH"

# ─────────────────────────────────────────────────────────────────────────────
section "6. Chats"

check "POST /chats" 201 \
  POST /chats -H "$H_AUTH" -H "Content-Type: application/json" \
  -d "{\"subjectId\":\"$SUBJ_ID\",\"title\":\"Test Chat\"}"
CHAT_ID=$(jval '.data.id')

check "GET /chats" 200 \
  GET /chats -H "$H_AUTH"

check "GET /chats?subjectId=..." 200 \
  GET "/chats?subjectId=$SUBJ_ID" -H "$H_AUTH"

check "GET /chats/:id" 200 \
  GET "/chats/$CHAT_ID" -H "$H_AUTH"

section "6b. Chat SSE"
SSE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 12 \
  -X POST "${BASE}/chats/${CHAT_ID}/messages" \
  -H "$H_AUTH" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"What is this course about?"}' 2>/dev/null || echo "000")
if [ "$SSE_STATUS" = "200" ]; then
  ok "POST /chats/:id/messages (SSE, HTTP 200)"
else
  fail "POST /chats/:id/messages — expected 200, got $SSE_STATUS"
fi

check "DELETE /chats/:id" 204 \
  DELETE "/chats/$CHAT_ID" -H "$H_AUTH"

# ─────────────────────────────────────────────────────────────────────────────
section "7. System"

check "GET /system/settings" 200 \
  GET /system/settings -H "$H_AUTH"

check "PATCH /system/settings" 200 \
  PATCH /system/settings -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"ai_daily_chat_limit":"50"}'

check "GET /system/audit-logs" 200 \
  GET /system/audit-logs -H "$H_AUTH"

check "GET /system/audit-logs?page=1&limit=5" 200 \
  GET "/system/audit-logs?page=1&limit=5" -H "$H_AUTH"

# ─────────────────────────────────────────────────────────────────────────────
section "8. Auth logout"

check "POST /auth/logout" 200 \
  POST /auth/logout -H "$H_AUTH" -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$NEW_REFRESH\"}"

# ─────────────────────────────────────────────────────────────────────────────
section "9. Cleanup"

# Re-login after logout
api POST /auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@educhat.local","password":"Admin@123456"}'
ADMIN_TOKEN2=$(jval '.data.accessToken')
H_AUTH2="Authorization: Bearer $ADMIN_TOKEN2"

if [ -n "$DOC_ID" ] && [ "$DOC_ID" != "null" ]; then
  check "DELETE documents/:id" 204 \
    DELETE "/subjects/$SUBJ_ID/documents/$DOC_ID" -H "$H_AUTH2"
fi

if [ -n "$LECT_ID" ] && [ "$LECT_ID" != "null" ]; then
  check "DELETE /subjects/:id/lecturers/:lecturerId" 204 \
    DELETE "/subjects/$SUBJ_ID/lecturers/$LECT_ID" -H "$H_AUTH2"
fi

check "DELETE /subjects/:id" 204 \
  DELETE "/subjects/$SUBJ_ID" -H "$H_AUTH2"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════"
TOTAL=$((PASS+FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${green}All $TOTAL tests passed ✓${reset}"
else
  echo -e "${yellow}$PASS / $TOTAL passed${reset}  ${red}$FAIL failed ✗${reset}"
fi
echo "════════════════════════════════════"
exit "$FAIL"
