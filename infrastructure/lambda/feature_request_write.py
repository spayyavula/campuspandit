# infrastructure/lambda/feature_request_write.py
import json
from pydantic import ValidationError
from shared.db import connect
from shared.models import FeatureRequestIn

def lambda_handler(event, _ctx):
    try:
        payload = FeatureRequestIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO feature_requests (title, description, audience, submitter_email)
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (payload.title, payload.description, payload.audience, payload.submitter_email),
        )
        row_id = cur.fetchone()[0]
        conn.commit()
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
