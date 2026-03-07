#!/usr/bin/env bash
# Test Kalshi base URL (from .env) and the integration server.
# Usage: from kalshi-integration folder run: ./scripts/test-base-url.sh
# Or: bash scripts/test-base-url.sh

set -e
cd "$(dirname "$0")/.."
source .env 2>/dev/null || true
BASE="${KALSHI_BASE_URL:-https://demo-api.kalshi.co/trade-api/v2}"

echo "=== 1. Base URL from env: $BASE ==="
echo "   Fetching markets (limit=2)..."
HTTP=$(curl -s -o /tmp/kalshi_markets.json -w "%{http_code}" --max-time 15 "$BASE/markets?limit=2" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ]; then
  echo "   HTTP $HTTP OK"
  count=$(python3 -c "import json; d=json.load(open('/tmp/kalshi_markets.json')); print(len(d.get('markets',[])))" 2>/dev/null || echo "?")
  echo "   Markets returned: $count"
  python3 -c "
import json
d = json.load(open('/tmp/kalshi_markets.json'))
for m in d.get('markets', [])[:3]:
    print('   -', m.get('title', 'N/A')[:55])
" 2>/dev/null || true
else
  echo "   HTTP $HTTP (timeout or error - production API may be geo-restricted)"
fi

echo ""
echo "=== 2. Integration server (localhost:4000) ==="
echo "   This uses whatever KALSHI_BASE_URL is in .env when the server was started."
echo "   Restart the server (npm run dev) after changing .env."
HTTP2=$(curl -s -o /tmp/kalshi_integration.json -w "%{http_code}" --max-time 8 "http://localhost:4000/api/markets?status=open&limit=2" 2>/dev/null || echo "000")
if [ "$HTTP2" = "200" ]; then
  echo "   HTTP $HTTP2 OK"
  success=$(python3 -c "import json; d=json.load(open('/tmp/kalshi_integration.json')); print(d.get('success', False))" 2>/dev/null || echo "?")
  count2=$(python3 -c "import json; d=json.load(open('/tmp/kalshi_integration.json')); print(len(d.get('data',[])))" 2>/dev/null || echo "?")
  echo "   success=$success, count=$count2"
else
  echo "   HTTP $HTTP2 - is the server running? (npm run dev)"
fi
