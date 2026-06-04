#!/bin/sh
set -eu

: "${HOST:=127.0.0.1}"
: "${PORT:=4000}"
: "${NGINX_PORT:=80}"
: "${JSON_BODY_LIMIT:=20mb}"
: "${NGINX_CLIENT_MAX_BODY_SIZE:=20m}"
: "${API_PROXY_PASS:=http://127.0.0.1:${PORT}}"

if [ -z "${DATABASE_URL:-}" ]; then
  cat >&2 <<'EOF'
DATABASE_URL is required.

Pass it to the container with:
  docker run --env-file .env -p 5174:80 ommr-admin-platform

Or set DATABASE_URL manually in Docker Desktop / your container runtime.
EOF
  exit 1
fi

export HOST PORT NGINX_PORT JSON_BODY_LIMIT NGINX_CLIENT_MAX_BODY_SIZE API_PROXY_PASS

envsubst '${NGINX_PORT} ${NGINX_CLIENT_MAX_BODY_SIZE} ${API_PROXY_PASS}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/http.d/default.conf

node /app/apps/admin-backend/dist/index.js &
backend_pid=$!

nginx -g "daemon off;" &
nginx_pid=$!

cat <<EOF
[web:container] http://127.0.0.1:${NGINX_PORT}
[backend:internal] ${API_PROXY_PASS}
EOF

shutdown() {
  kill "$backend_pid" "$nginx_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
  wait "$nginx_pid" 2>/dev/null || true
}

trap shutdown INT TERM

while true; do
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    wait "$backend_pid"
    exit_code=$?
    shutdown
    exit "$exit_code"
  fi

  if ! kill -0 "$nginx_pid" 2>/dev/null; then
    wait "$nginx_pid"
    exit_code=$?
    shutdown
    exit "$exit_code"
  fi

  sleep 1
done
