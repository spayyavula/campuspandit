"""Shared configuration for all deploy scripts."""
import os
import boto3

PROJECT_NAME = "campuspandit"
ENV = "prod"
REGION = os.environ.get("AWS_REGION", "ap-south-1")
PROFILE = os.environ.get("AWS_PROFILE", "default")

SESSION = boto3.Session(profile_name=PROFILE, region_name=REGION)
ACCOUNT_ID = SESSION.client("sts").get_caller_identity()["Account"]

TAGS = [
    {"Key": "Project", "Value": PROJECT_NAME},
    {"Key": "ManagedBy", "Value": "boto3-deploy"},
    {"Key": "Environment", "Value": ENV},
]

# Resource naming constants
RDS_INSTANCE_ID = "campuspandit-prod"
RDS_SECRET_NAME = "campuspandit/prod/db_master"
RDS_PROXY_NAME = "campuspandit-proxy"
API_NAME = "campuspandit-observe"
AMPLIFY_APP_NAME = "campuspandit"
COGNITO_POOL_NAME = "campuspandit-users"
BACKUP_VAULT_NAME = "campuspandit-prod"
LAMBDA_HANDLERS = [
    "pilot_application_write",
    "feature_request_write",
    "feature_request_read",
    "engagement_signal_write",
    "vote_write",
]
DOMAIN = "campuspandit.ai"
SUBDOMAIN = "www.campuspandit.ai"
