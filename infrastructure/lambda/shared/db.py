# infrastructure/lambda/shared/db.py
"""IAM-authenticated psycopg connection to RDS Proxy."""
import os
import psycopg
import boto3

_RDS_CLIENT = boto3.client("rds")

def connect():
    host = os.environ["DATABASE_PROXY_HOST"]
    db = os.environ["DATABASE_NAME"]
    region = os.environ.get("AWS_REGION", "ap-south-1")
    token = _RDS_CLIENT.generate_db_auth_token(
        DBHostname=host, Port=5432, DBUsername="lambda_app", Region=region
    )
    return psycopg.connect(
        host=host, port=5432, dbname=db, user="lambda_app",
        password=token, sslmode="require",
    )
