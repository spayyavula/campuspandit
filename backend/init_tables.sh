#!/bin/bash
# Simple script to initialize database tables
# Run this manually: bash backend/init_tables.sh

cd "$(dirname "$0")"
python3 scripts/init_db_simple.py
