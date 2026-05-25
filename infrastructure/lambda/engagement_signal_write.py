# infrastructure/lambda/engagement_signal_write.py
import json
from pydantic import ValidationError
from shared.db import connect
from shared.models import EngagementSignalIn

def lambda_handler(event, _ctx):
    try:
        payload = EngagementSignalIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO engagement_signals (signal_type, url, session_hash, payload)
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (payload.signal_type, payload.url, payload.session_hash,
             json.dumps(payload.payload) if payload.payload else None),
        )
        row_id = cur.fetchone()[0]
        conn.commit()
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
