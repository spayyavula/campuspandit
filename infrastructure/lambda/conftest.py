# infrastructure/lambda/conftest.py
"""Spin up a local Postgres via docker for each test session."""
import os
import subprocess
import time
import pytest
import psycopg


def pytest_configure(config):
    """Set dummy AWS env vars before any module is imported.

    shared/db.py calls boto3.client('rds') at import time, which requires a
    region.  These stubs satisfy boto3 during collection; the actual connect()
    is monkeypatched in the patched_connect fixture before any handler is called.
    """
    os.environ.setdefault("AWS_DEFAULT_REGION", "ap-south-1")
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")

CONTAINER = "campuspandit-test-pg"
PORT = "55432"
DB = "campuspandit_test"

@pytest.fixture(scope="session", autouse=True)
def postgres():
    subprocess.run(["docker", "rm", "-f", CONTAINER], capture_output=True)
    subprocess.run([
        "docker", "run", "-d", "--name", CONTAINER,
        "-e", "POSTGRES_PASSWORD=test", "-e", f"POSTGRES_DB={DB}",
        "-p", f"{PORT}:5432", "postgres:16-alpine",
    ], check=True)
    # Wait for readiness
    url = f"postgres://postgres:test@localhost:{PORT}/{DB}"
    for _ in range(30):
        try:
            with psycopg.connect(url): break
        except psycopg.OperationalError:
            time.sleep(1)
    else:
        raise RuntimeError("Postgres failed to start within 30s")
    # Apply DDL
    with psycopg.connect(url) as conn, conn.cursor() as cur:
        with open("../sql/01_admin_tables.sql") as f:
            cur.execute(f.read())
        conn.commit()
    # Stub the IAM-auth db.connect() to use the local container
    os.environ["DATABASE_PROXY_HOST"] = "localhost"
    os.environ["DATABASE_NAME"] = DB
    yield url
    subprocess.run(["docker", "rm", "-f", CONTAINER], capture_output=True)

@pytest.fixture
def patched_connect(monkeypatch, postgres):
    """Override the IAM token path; use postgres user with the test password."""
    from shared import db as db_module
    def fake_connect():
        return psycopg.connect(postgres)
    monkeypatch.setattr(db_module, "connect", fake_connect)
    # Also patch the import in each handler module
    for mod in ["pilot_application_write", "feature_request_write",
                "feature_request_read", "engagement_signal_write", "vote_write"]:
        import importlib
        m = importlib.import_module(mod)
        monkeypatch.setattr(m, "connect", fake_connect)
