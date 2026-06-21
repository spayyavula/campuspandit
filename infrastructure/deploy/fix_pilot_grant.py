"""One-off remediation: re-apply lambda_app table grants to the live RDS.

Root cause (2026-06-21 cutover): GET /feature-requests returned 200 but
POST /pilot-applications returned 500 with
  InsufficientPrivilege: permission denied for table pilot_applications
lambda_app exists and can SELECT feature_requests, but never received the
INSERT grant on pilot_applications (and possibly the other write tables) on
the live DB. This reconciles the live grants with infrastructure/sql/02_lambda_app_role.sql.

Idempotent. Opens a temporary SG ingress for the local public IP and revokes
it in a finally block. Usage:
  python fix_pilot_grant.py [aws_profile]   # default profile if omitted
"""
import sys
import json
import urllib.request
import boto3
import psycopg

REGION = "ap-south-1"

# Mirrors infrastructure/sql/02_lambda_app_role.sql (GRANT lines only; CREATE USER omitted).
# SELECT is required on every write-path table because all write handlers use
# "INSERT ... RETURNING id", and RETURNING needs SELECT on the returned column.
# The original SQL granted SELECT only on feature_requests, silently breaking the
# pilot/engagement/vote write paths (42501 permission denied for table).
GRANTS = [
    "GRANT INSERT ON pilot_applications TO lambda_app;",
    "GRANT INSERT ON feature_requests TO lambda_app;",
    "GRANT INSERT ON engagement_signals TO lambda_app;",
    "GRANT INSERT ON feature_request_votes TO lambda_app;",
    "GRANT SELECT ON pilot_applications TO lambda_app;",
    "GRANT SELECT ON feature_requests TO lambda_app;",
    "GRANT SELECT ON engagement_signals TO lambda_app;",
    "GRANT SELECT ON feature_request_votes TO lambda_app;",
]

profile = sys.argv[1] if len(sys.argv) > 1 else None
session = boto3.Session(profile_name=profile, region_name=REGION)
ssm = session.client("ssm")
sm = session.client("secretsmanager")
ec2 = session.client("ec2")


def ssm_get(name):
    return ssm.get_parameter(Name=name)["Parameter"]["Value"]


endpoint = ssm_get("/campuspandit/deploy/rds/endpoint")
secret_arn = ssm_get("/campuspandit/deploy/rds/secret_arn")
sg_id = ssm_get("/campuspandit/deploy/rds/security_group_id")

secret = json.loads(sm.get_secret_value(SecretId=secret_arn)["SecretString"])
user = secret["username"]
pwd = secret["password"]
db = secret["dbname"]
port = int(secret.get("port", 5432))

my_ip = urllib.request.urlopen("https://checkip.amazonaws.com").read().decode().strip()
cidr = f"{my_ip}/32"

print(f"endpoint={endpoint} db={db} user={user} sg={sg_id} ip={cidr} profile={profile or 'default'}")

added = False
try:
    try:
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[{
                "IpProtocol": "tcp", "FromPort": port, "ToPort": port,
                "IpRanges": [{"CidrIp": cidr, "Description": "temp pilot-grant fix 2026-06-21"}],
            }],
        )
        added = True
        print(f"ingress added: {cidr}:{port}")
    except ec2.exceptions.ClientError as e:
        if "InvalidPermission.Duplicate" in str(e):
            print("ingress already present - continuing")
        else:
            raise

    conn = psycopg.connect(
        host=endpoint, port=port, user=user, password=pwd, dbname=db,
        sslmode="require", connect_timeout=20,
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        for g in GRANTS:
            cur.execute(g)
            print("applied:", g)
        cur.execute(
            "SELECT table_name, privilege_type FROM information_schema.role_table_grants "
            "WHERE grantee='lambda_app' ORDER BY table_name, privilege_type;"
        )
        print("--- lambda_app grants now live ---")
        for tbl, priv in cur.fetchall():
            print(f"   {tbl:<22} {priv}")
    conn.close()
    print("DONE")
finally:
    if added:
        try:
            ec2.revoke_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[{
                    "IpProtocol": "tcp", "FromPort": port, "ToPort": port,
                    "IpRanges": [{"CidrIp": cidr}],
                }],
            )
            print(f"ingress revoked: {cidr}:{port}")
        except Exception as e:
            print(f"WARN: could not revoke ingress {cidr}: {e} -- remove it manually from {sg_id}")
