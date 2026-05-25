-- infrastructure/sql/02_lambda_app_role.sql
-- Database role for Lambda functions.
--
-- Authentication architecture:
--   Lambda --(IAM token)--> RDS Proxy --(password from secret)--> RDS
--
-- IAM auth is terminated AT THE PROXY (validated against the Lambda exec
-- role's rds-db:connect permission on the proxy resource). The proxy then
-- uses the lambda_app secret's password to log into RDS.
--
-- Therefore lambda_app must be a PASSWORD-AUTH user. Granting rds_iam here
-- would make RDS reject password auth from the proxy (PAM-only mode), and
-- the proxy cannot use IAM auth to RDS itself.
--
-- The password is set out-of-band by bootstrap_proxy_lambda_app.ps1 and
-- stored in Secrets Manager (campuspandit/prod/lambda_app).

CREATE USER lambda_app;

-- INSERT-only on the write-path tables
GRANT INSERT ON pilot_applications TO lambda_app;
GRANT INSERT ON feature_requests TO lambda_app;
GRANT INSERT ON engagement_signals TO lambda_app;
GRANT INSERT ON feature_request_votes TO lambda_app;

-- SELECT only what the GET /feature-requests endpoint needs
GRANT SELECT ON feature_requests TO lambda_app;
