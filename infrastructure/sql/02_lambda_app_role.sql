-- infrastructure/sql/02_lambda_app_role.sql
-- Database role for Lambda functions. Uses IAM authentication (no password).

CREATE USER lambda_app;
GRANT rds_iam TO lambda_app;

-- INSERT-only on the write-path tables
GRANT INSERT ON pilot_applications TO lambda_app;
GRANT INSERT ON feature_requests TO lambda_app;
GRANT INSERT ON engagement_signals TO lambda_app;
GRANT INSERT ON feature_request_votes TO lambda_app;

-- SELECT only what the GET /feature-requests endpoint needs
GRANT SELECT ON feature_requests TO lambda_app;
