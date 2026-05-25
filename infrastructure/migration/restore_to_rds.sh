#!/usr/bin/env bash
# infrastructure/migration/restore_to_rds.sh
# Restore the Azure dump to RDS. Required env: RDS_URL, DUMP_FILE
set -euo pipefail
: "${RDS_URL:?RDS_URL must be set}"
: "${DUMP_FILE:?DUMP_FILE must be set}"
pg_restore --no-owner --no-acl --exit-on-error --dbname="${RDS_URL}" --verbose "${DUMP_FILE}"
