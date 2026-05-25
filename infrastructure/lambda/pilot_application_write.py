# infrastructure/lambda/pilot_application_write.py
import json
from pydantic import ValidationError
from shared.db import connect
from shared.models import PilotApplicationIn

def lambda_handler(event, _ctx):
    try:
        payload = PilotApplicationIn.model_validate_json(event.get("body") or "{}")
    except ValidationError as e:
        return {"statusCode": 400, "body": e.json()}
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO pilot_applications
               (center_name, owner_name, location, students_count, subjects_taught,
                current_software, website_or_instagram, contact_email, contact_phone, message)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (payload.center_name, payload.owner_name, payload.location,
             payload.students_count, payload.subjects_taught, payload.current_software,
             payload.website_or_instagram, payload.contact_email, payload.contact_phone,
             payload.message),
        )
        row_id = cur.fetchone()[0]
        conn.commit()
    return {"statusCode": 201, "body": json.dumps({"id": str(row_id)})}
