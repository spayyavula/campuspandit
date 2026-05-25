#!/usr/bin/env bash
# infrastructure/migration/dump_azure.sh
# Dump Azure Postgres to a local custom-format file.
# Required env: AZURE_PG_URL (full postgres://user:pass@host:port/db)
set -euo pipefail
: "${AZURE_PG_URL:?AZURE_PG_URL must be set}"
out="campuspandit-azure-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --no-owner --no-acl --format=custom --file="${out}" "${AZURE_PG_URL}"
echo "Wrote ${out} ($(du -h "${out}" | cut -f1))"
