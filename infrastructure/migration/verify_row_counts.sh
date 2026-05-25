#!/usr/bin/env bash
# infrastructure/migration/verify_row_counts.sh
# Compare row counts between Azure and RDS for every public-schema table.
# Required env: AZURE_PG_URL, RDS_URL
set -euo pipefail
: "${AZURE_PG_URL:?AZURE_PG_URL must be set}"
: "${RDS_URL:?RDS_URL must be set}"

tables=$(psql "${AZURE_PG_URL}" -At -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")

printf "%-40s %12s %12s %s\n" "TABLE" "AZURE" "RDS" "MATCH?"
fail=0
for t in $tables; do
  az=$(psql "${AZURE_PG_URL}" -At -c "SELECT count(*) FROM public.\"${t}\"")
  rds=$(psql "${RDS_URL}" -At -c "SELECT count(*) FROM public.\"${t}\"")
  if [ "$az" = "$rds" ]; then
    mark="OK"
  else
    mark="MISMATCH"
    fail=1
  fi
  printf "%-40s %12s %12s %s\n" "$t" "$az" "$rds" "$mark"
done
exit $fail
