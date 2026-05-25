# infrastructure/lambda/tests/test_handlers.py
import json
import pytest
import pilot_application_write
import feature_request_write
import feature_request_read
import engagement_signal_write
import vote_write

def _event(body: dict) -> dict:
    return {"body": json.dumps(body)}

def test_pilot_application_happy_path(patched_connect):
    res = pilot_application_write.lambda_handler(_event({
        "center_name": "Pinnacle JEE", "owner_name": "Asha",
        "location": "Pune", "students_count": 120,
        "subjects_taught": ["Physics", "Math"],
        "contact_email": "asha@example.com",
    }), None)
    assert res["statusCode"] == 201
    assert "id" in json.loads(res["body"])

def test_pilot_application_bad_email(patched_connect):
    res = pilot_application_write.lambda_handler(_event({
        "center_name": "X", "owner_name": "Y", "location": "Z",
        "students_count": 10, "subjects_taught": ["Physics"],
        "contact_email": "not-an-email",
    }), None)
    assert res["statusCode"] == 400

def test_feature_request_write_and_read(patched_connect, postgres):
    # Write
    w = feature_request_write.lambda_handler(_event({
        "title": "Email digest on Mondays",
        "description": "Weekly summary for owners",
        "audience": "coaching_center",
    }), None)
    assert w["statusCode"] == 201

    # Mark it published so the read endpoint surfaces it
    import psycopg
    with psycopg.connect(postgres) as conn, conn.cursor() as cur:
        cur.execute("UPDATE feature_requests SET is_published = true")
        conn.commit()

    r = feature_request_read.lambda_handler({}, None)
    assert r["statusCode"] == 200
    body = json.loads(r["body"])
    assert len(body) == 1
    assert body[0]["title"] == "Email digest on Mondays"

def test_engagement_signal_write(patched_connect):
    res = engagement_signal_write.lambda_handler(_event({
        "signal_type": "scroll_depth_75",
        "url": "https://www.campuspandit.ai/for-students",
        "payload": {"depth": 0.75},
    }), None)
    assert res["statusCode"] == 201

def test_vote_double_vote_returns_409(patched_connect, postgres):
    # Need a feature_request to vote on
    import psycopg
    with psycopg.connect(postgres) as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO feature_requests (title, audience) VALUES ('Test', 'both') RETURNING id"
        )
        fr_id = cur.fetchone()[0]
        conn.commit()
    body = {"feature_request_id": str(fr_id), "voter_email": "v@example.com"}
    first = vote_write.lambda_handler(_event(body), None)
    assert first["statusCode"] == 201
    second = vote_write.lambda_handler(_event(body), None)
    assert second["statusCode"] == 409
