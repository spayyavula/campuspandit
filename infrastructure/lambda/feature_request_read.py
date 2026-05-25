# infrastructure/lambda/feature_request_read.py
import json
from shared.db import connect

def lambda_handler(_event, _ctx):
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT id, title, description, audience, upvotes, created_at
               FROM feature_requests
               WHERE is_published = true
               ORDER BY created_at DESC
               LIMIT 10"""
        )
        rows = [
            {"id": str(r[0]), "title": r[1], "description": r[2],
             "audience": r[3], "upvotes": r[4], "created_at": r[5].isoformat()}
            for r in cur.fetchall()
        ]
    return {"statusCode": 200, "body": json.dumps(rows)}
