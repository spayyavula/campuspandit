# infrastructure/lambda/vote_write.py
import json
from pydantic import ValidationError
from psycopg.errors import UniqueViolation
from shared.db import connect
from shared.models import VoteIn

def lambda_handler(event, _ctx):
    try:
        payload = VoteIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO feature_request_votes (feature_request_id, voter_email)
                   VALUES (%s, %s) RETURNING id""",
                (payload.feature_request_id, payload.voter_email),
            )
            row_id = cur.fetchone()[0]
            conn.commit()
    except UniqueViolation:
        return {"statusCode": 409, "body": json.dumps({"error": "already_voted"})}
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
