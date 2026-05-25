# infrastructure/lambda/shared/models.py
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, conlist

class PilotApplicationIn(BaseModel):
    center_name: str = Field(min_length=1, max_length=200)
    owner_name: str = Field(min_length=1, max_length=200)
    location: str = Field(min_length=1, max_length=200)
    students_count: int = Field(ge=1, le=100_000)
    subjects_taught: conlist(str, min_length=1, max_length=20)
    current_software: str | None = None
    website_or_instagram: str | None = None
    contact_email: EmailStr
    contact_phone: str | None = None
    message: str | None = Field(default=None, max_length=4000)

Audience = Literal["coaching_center", "prospective_cc_via_student", "both"]

class FeatureRequestIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    audience: Audience
    submitter_email: EmailStr | None = None

class FeatureRequestOut(BaseModel):
    id: str
    title: str
    description: str | None
    audience: str
    upvotes: int
    created_at: str

class EngagementSignalIn(BaseModel):
    signal_type: str = Field(max_length=64)
    url: str = Field(max_length=2000)
    session_hash: str | None = None
    payload: dict | None = None

class VoteIn(BaseModel):
    feature_request_id: str
    voter_email: EmailStr
