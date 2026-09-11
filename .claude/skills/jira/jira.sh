#!/usr/bin/env bash
#
# jira.sh — CLI mỏng cho Jira Data Center (https://jira.fcam.vn), auth bằng Personal Access Token.
#
# TOKEN CHỈ Ở LOCAL — script KHÔNG chứa secret. Token gắn với INSTANCE (jira.fcam.vn),
# dùng chung cho MỌI project trên đó (RPA, B2B, ...). Cấu hình 1 trong 2 cách:
#
#   (a) File .jira.env (gitignored). Ưu tiên: ./.jira.env (per-repo) rồi ~/.jira.env (global).
#       Vì 1 token dùng chung cả instance, đặt ~/.jira.env là gọn nhất:
#         FCAM_JIRA_PAT=xxxxxxxxxxxxxxxx
#         FCAM_JIRA_PROJECT=RPA          # project mặc định cho lệnh 'task' (repo này: RPA)
#       Script tự nạp .jira.env.
#
#   (b) Hoặc export trong ~/.zshrc (env sẵn sẽ được ưu tiên hơn file):
#         export FCAM_JIRA_PAT='xxxxxxxxxxxxxxxx'
#         export FCAM_JIRA_PROJECT='RPA'
#
#   Alias tiện dùng:
#         alias jira='bash /ABS/PATH/TO/REPO/.claude/skills/jira/jira.sh'
#
# Nguồn gốc: b2b-gokit/.claude/skills/git-flow/jira.sh — bản sao. Sửa bên nào thì sync bên kia.
#
# Project key cho lệnh 'task': arg tường minh > $FCAM_JIRA_PROJECT > file .jira-project ở CWD.
# Các lệnh khác (comment/subtask/worklog/transition) lấy project từ chính issue key (RPA-123).
#
set -euo pipefail

# Nạp cấu hình Jira nếu chưa có trong env: ./.jira.env (per-repo) rồi ~/.jira.env (global)
if [ -z "${FCAM_JIRA_PAT:-}" ]; then
  set -a
  [ -f ./.jira.env ] && . ./.jira.env
  [ -z "${FCAM_JIRA_PAT:-}" ] && [ -f "$HOME/.jira.env" ] && . "$HOME/.jira.env"
  set +a
fi

FCAM_JIRA_BASE="${FCAM_JIRA_BASE:-https://jira.fcam.vn}"
# Cắt dấu "/" cuối: base có slash -> nối thành "//rest/api/2" -> Jira trả 404 kèm
# message "null for uri", rất khó đoán là do config (đo 2026-09-07).
FCAM_JIRA_BASE="${FCAM_JIRA_BASE%/}"
API="$FCAM_JIRA_BASE/rest/api/2"
# Agile API (board/sprint) nằm ở path khác, không phải /rest/api/2.
AGILE="$FCAM_JIRA_BASE/rest/agile/1.0"

_jstr() { python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"; }

_api() {
  : "${FCAM_JIRA_PAT:?Chưa set FCAM_JIRA_PAT — tạo PAT trên jira.fcam.vn rồi để vào .env hoặc export (xem đầu file). KHÔNG commit token.}"
  local method="$1" path="$2" body="${3:-}" out code
  local args=(-sS --connect-timeout 15 --max-time 60 -w '\n%{http_code}' -X "$method"
              -H "Authorization: Bearer $FCAM_JIRA_PAT"
              -H "Content-Type: application/json" -H "Accept: application/json")
  [ -n "$body" ] && args+=(--data "$body")
  out="$(curl "${args[@]}" "$API$path")"
  code="$(printf '%s' "$out" | tail -n1)"
  body="$(printf '%s' "$out" | sed '$d')"
  if [ "$code" -ge 400 ]; then
    echo "LỖI HTTP $code từ $method $path" >&2
    printf '%s\n' "$body" >&2
    return 1
  fi
  printf '%s' "$body"
}

_agile() {
  : "${FCAM_JIRA_PAT:?Chưa set FCAM_JIRA_PAT}"
  local method="$1" path="$2" body="${3:-}" out code
  local args=(-sS --connect-timeout 15 --max-time 60 -w '\n%{http_code}' -X "$method"
              -H "Authorization: Bearer $FCAM_JIRA_PAT"
              -H "Content-Type: application/json" -H "Accept: application/json")
  [ -n "$body" ] && args+=(--data "$body")
  out="$(curl "${args[@]}" "$AGILE$path")"
  code="$(printf '%s' "$out" | tail -n1)"
  body="$(printf '%s' "$out" | sed '$d')"
  if [ "$code" -ge 400 ]; then
    echo "LỖI HTTP $code từ $method (agile) $path" >&2
    printf '%s\n' "$body" >&2
    return 1
  fi
  printf '%s' "$body"
}

_field() { python3 -c 'import sys,json; d=json.load(sys.stdin); print(eval("d"+sys.argv[1]))' "$1"; }

# Project cho 'task': arg > env > file .jira-project
_resolve_project() {
  local p="${1:-}"
  [ -n "$p" ] && { echo "$p"; return; }
  [ -n "${FCAM_JIRA_PROJECT:-}" ] && { echo "$FCAM_JIRA_PROJECT"; return; }
  if [ -f .jira-project ]; then
    local fp; fp="$(head -n1 .jira-project | tr -d '[:space:]')"
    [ -n "$fp" ] && { echo "$fp"; return; }
  fi
  echo "Chưa xác định được project key. Cách: arg thứ 2, hoặc \$FCAM_JIRA_PROJECT, hoặc file .jira-project ở repo." >&2
  return 1
}

# Hứng kết quả API vào biến TRƯỚC khi đưa qua python3: nếu gọi trực tiếp trong pipeline,
# API hỏng thì python vẫn chạy trên stdin rỗng và nôn traceback đè lên thông báo lỗi thật.
# Gán vào biến thì set -e + pipefail thoát ngay tại dòng gán.
cmd="${1:-}"; shift || true
case "$cmd" in
  me)      OUT="$(_api GET /myself)"; printf '%s' "$OUT" | _field '["displayName"]' ;;
  whoami)  OUT="$(_api GET /myself)"; printf '%s' "$OUT" | _field '["emailAddress"]' ;;
  key)
    # Rút Jira key từ nhánh git hiện tại: <type>/<KEY>-<brief>
    br="$(git branch --show-current 2>/dev/null)"
    # `|| true`: pipefail + set -e làm script chết ngay tại đây khi grep không khớp,
    # nên nhánh không mang key sẽ exit 1 mà KHÔNG in được lý do. Bug này có cả ở bản gokit.
    k="$(printf '%s' "$br" | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | head -1 || true)"
    if [ -n "$k" ]; then echo "$k"; else echo "Không rút được Jira key từ nhánh '$br' (cần dạng <type>/<KEY>-...)" >&2; exit 1; fi ;;
  view)
    KEY="${1:?cần issue key}"
    OUT="$(_api GET "/issue/$KEY?fields=summary,status")"
    printf '%s' "$OUT" \
      | python3 -c 'import sys,json; d=json.load(sys.stdin)["fields"]; print(d["summary"]+"  ["+d["status"]["name"]+"]")' ;;
  comment)
    KEY="${1:?cần issue key}"; shift; TEXT="$*"
    _api POST "/issue/$KEY/comment" "{\"body\": $(_jstr "$TEXT")}" >/dev/null
    echo "✓ đã comment vào $KEY" ;;
  summary)
    KEY="${1:?cần issue key}"; shift; TEXT="$*"
    _api PUT "/issue/$KEY" "{\"fields\":{\"summary\":$(_jstr "$TEXT")}}" >/dev/null
    echo "✓ đã cập nhật summary cho $KEY" ;;
  point)
    # Ticket Point — quy ước 1 point = 1 giờ. Sub-task tối đa 8h (1 ngày). Field qua $FCAM_JIRA_POINT_FIELD (mặc định customfield_10301).
    KEY="${1:?cần issue key}"; VAL="${2:?cần số point (giờ)}"; PF="${FCAM_JIRA_POINT_FIELD:-customfield_10301}"
    case "$VAL" in ''|*[!0-9.]*|*.*.*) echo "point phải là số (vd 8 hoặc 2.5)" >&2; exit 1 ;; esac
    IS_SUB="$(_api GET "/issue/$KEY?fields=issuetype" | _field '["fields"]["issuetype"]["subtask"]')"
    if [ "$IS_SUB" = "True" ] && awk "BEGIN{exit !($VAL>8)}"; then
      echo "✗ $KEY là sub-task -> tối đa 8h (1 ngày làm việc). $VAL h quá lớn: tách thành nhiều sub-task, mỗi cái <=8h." >&2; exit 1
    fi
    _api PUT "/issue/$KEY" "{\"fields\":{\"$PF\":$VAL}}" >/dev/null
    echo "✓ đã set Ticket Point $KEY = $VAL (= ${VAL}h)" ;;
  describe)
    KEY="${1:?cần issue key}"; shift; TEXT="$*"
    _api PUT "/issue/$KEY" "{\"fields\":{\"description\":$(_jstr "$TEXT")}}" >/dev/null
    echo "✓ đã cập nhật description cho $KEY" ;;
  assign)
    # Gán người thực hiện. Không truyền user thì gán CHÍNH MÌNH.
    # Jira Data Center định danh bằng `name` (username) — KHÔNG phải `accountId` của Jira
    # Cloud; gửi accountId vào đây thì API trả 400 và không nói rõ vì sao.
    KEY="${1:?cần issue key}"; USER="${2:-}"
    if [ -z "$USER" ]; then OUT="$(_api GET /myself)"; USER="$(printf '%s' "$OUT" | _field '["name"]')"; fi
    _api PUT "/issue/$KEY/assignee" "{\"name\":$(_jstr "$USER")}" >/dev/null
    echo "✓ đã gán $KEY cho $USER" ;;
  task)
    SUM="${1:?cần summary}"; PROJ="$(_resolve_project "${2:-}")"; DESC="${3:-}"
    FIELDS="\"project\":{\"key\":\"$PROJ\"},\"summary\":$(_jstr "$SUM"),\"issuetype\":{\"name\":\"Task\"}"
    [ -n "$DESC" ] && FIELDS="$FIELDS,\"description\":$(_jstr "$DESC")"
    RES="$(_api POST /issue "{\"fields\":{$FIELDS}}")"
    echo "✓ tạo task $(printf '%s' "$RES" | _field '["key"]') trong $PROJ" ;;
  story)
    # Story: issue cấp trên của sub-task. Component tuỳ chọn (vd NewCoreFit, TechDebt-FRT-Ops).
    SUM="${1:?cần summary}"; PROJ="$(_resolve_project "${2:-}")"; DESC="${3:-}"; COMP="${4:-}"
    FIELDS="\"project\":{\"key\":\"$PROJ\"},\"summary\":$(_jstr "$SUM"),\"issuetype\":{\"name\":\"Story\"}"
    [ -n "$DESC" ] && FIELDS="$FIELDS,\"description\":$(_jstr "$DESC")"
    [ -n "$COMP" ] && FIELDS="$FIELDS,\"components\":[{\"name\":$(_jstr "$COMP")}]"
    RES="$(_api POST /issue "{\"fields\":{$FIELDS}}")"
    echo "✓ tạo story $(printf '%s' "$RES" | _field '["key"]') trong $PROJ" ;;
  versions)
    # Version (Fix Version) của project — dùng để lấy TÊN chính xác truyền cho 'fixversion'.
    PROJ="$(_resolve_project "${1:-}")"
    OUT="$(_api GET "/project/$PROJ/versions")"
    printf '%s' "$OUT" \
      | python3 -c 'import sys,json
for v in json.load(sys.stdin):
    print(("đã phát hành" if v.get("released") else "chưa phát hành")+"\t"+(v.get("releaseDate") or "—")+"\t"+v["name"])' ;;
  fixversion)
    # Gắn Fix Version cho issue — THAY THẾ toàn bộ fix version đang có, không cộng thêm.
    # Truyền --clear (hoặc chuỗi rỗng) để gỡ hết.
    #
    # Kiểm tên version trước khi PUT: Jira nhận tên lạ ở một số cấu hình rồi tự tạo
    # version mới, làm rác danh sách release mà không báo lỗi gì.
    #
    # Gắn ở cấp Story/Task là đủ — sub-task thừa hưởng version của cha khi lên release notes.
    KEY="${1:?cần issue key}"; NAME="${2?cần tên version, hoặc --clear để gỡ}"; PROJ="${KEY%%-*}"
    CUR="$(_api GET "/issue/$KEY?fields=fixVersions")"
    OLD="$(printf '%s' "$CUR" | python3 -c 'import sys,json
print(", ".join(v["name"] for v in json.load(sys.stdin)["fields"]["fixVersions"]) or "(trống)")')"
    if [ "$NAME" = "--clear" ] || [ -z "$NAME" ]; then
      _api PUT "/issue/$KEY" '{"fields":{"fixVersions":[]}}' >/dev/null
      echo "✓ $KEY fix version: $OLD -> (trống)"
      exit 0
    fi
    VERS="$(_api GET "/project/$PROJ/versions")"
    printf '%s' "$VERS" | python3 -c 'import sys,json
n=sys.argv[1]
sys.exit(0 if any(v["name"]==n for v in json.load(sys.stdin)) else 1)' "$NAME" \
      || { echo "✗ project $PROJ không có version '$NAME'. Xem danh sách: jira versions $PROJ" >&2; exit 1; }
    _api PUT "/issue/$KEY" "{\"fields\":{\"fixVersions\":[{\"name\":$(_jstr "$NAME")}]}}" >/dev/null
    echo "✓ $KEY fix version: $OLD -> $NAME" ;;
  sprint)
    # Đưa issue vào sprint (board scrum). Xem sprint: 'jira sprints <boardId>'.
    SID="${1:?cần sprint id}"; KEY="${2:?cần issue key}"
    _agile POST "/sprint/$SID/issue" "{\"issues\":[\"$KEY\"]}" >/dev/null
    echo "✓ đưa $KEY vào sprint $SID" ;;
  sprints)
    BID="${1:?cần board id}"
    OUT="$(_agile GET "/board/$BID/sprint?state=active,future")"
    printf '%s' "$OUT" \
      | python3 -c 'import sys,json
for s in json.load(sys.stdin).get("values",[]): print(str(s["id"])+"\t"+s["state"]+"\t"+s["name"])' ;;
  subtask)
    PARENT="${1:?cần parent key}"; SUM="${2:?cần summary}"; DESC="${3:-}"; PROJ="${PARENT%%-*}"
    FIELDS="\"project\":{\"key\":\"$PROJ\"},\"parent\":{\"key\":\"$PARENT\"},\"summary\":$(_jstr "$SUM"),\"issuetype\":{\"name\":\"Sub-task\"}"
    [ -n "$DESC" ] && FIELDS="$FIELDS,\"description\":$(_jstr "$DESC")"
    RES="$(_api POST /issue "{\"fields\":{$FIELDS}}")"
    echo "✓ tạo subtask $(printf '%s' "$RES" | _field '["key"]') dưới $PARENT" ;;
  worklog)
    KEY="${1:?cần issue key}"; TIME="${2:?cần thời gian, vd 2h/30m}"; shift 2 || true; COMMENT="$*"
    # KHÔNG nhúng `$([ -n .. ] && echo ..)` vào chuỗi: comment rỗng -> test trả 1 -> set -e
    # giết script NGAY tại dòng gán, không POST và không in lý do (đo 2026-09-04).
    BODY="{\"timeSpent\":$(_jstr "$TIME")"
    [ -n "$COMMENT" ] && BODY="$BODY,\"comment\":$(_jstr "$COMMENT")"
    BODY="$BODY}"
    _api POST "/issue/$KEY/worklog" "$BODY" >/dev/null
    echo "✓ log $TIME vào $KEY" ;;
  transitions)
    KEY="${1:?cần issue key}"
    OUT="$(_api GET "/issue/$KEY/transitions")"
    printf '%s' "$OUT" \
      | python3 -c 'import sys,json
for t in json.load(sys.stdin)["transitions"]: print(t["id"]+"\t"+t["name"])' ;;
  transition)
    KEY="${1:?cần issue key}"; TARGET="${2:?cần tên hoặc id transition}"
    OUT="$(_api GET "/issue/$KEY/transitions")"
    TID="$(printf '%s' "$OUT" \
      | python3 -c 'import sys,json; t=json.load(sys.stdin)["transitions"]; a=sys.argv[1];
m=[x for x in t if x["id"]==a or x["name"].lower()==a.lower()]; print(m[0]["id"] if m else "")' "$TARGET")"
    [ -n "$TID" ] || { echo "Không thấy transition '$TARGET' cho $KEY. Xem: jira transitions $KEY" >&2; exit 1; }
    _api POST "/issue/$KEY/transitions" "{\"transition\":{\"id\":\"$TID\"}}" >/dev/null
    echo "✓ $KEY -> $TARGET" ;;
  ""|-h|--help|help) sed -n '2,32p' "$0" ;;
  *) echo "Lệnh không rõ: $cmd (chạy 'jira help')" >&2; exit 1 ;;
esac
