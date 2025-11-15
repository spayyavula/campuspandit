"""
Schemas Package
Import all Pydantic schemas for API validation
"""

from app.schemas.coaching import (
    WeakAreaResponse, CoachingSessionResponse, RepetitionResponse,
    AnalyticsResponse, RecommendationResponse, SuccessResponse,
    UpdateRecommendationRequest, CompleteRepetitionRequest
)
from app.schemas.crm import (
    # Company schemas
    CompanyCreate, CompanyUpdate, CompanyResponse,
    # Contact schemas
    ContactCreate, ContactUpdate, ContactResponse,
    # Deal schemas
    DealCreate, DealUpdate, DealResponse,
    # Activity schemas
    ActivityCreate, ActivityUpdate, ActivityResponse,
    # Task schemas
    TaskCreate, TaskUpdate, TaskResponse,
    # Campaign schemas
    CampaignCreate, CampaignUpdate, CampaignResponse,
    # Ticket schemas
    TicketCreate, TicketUpdate, TicketResponse,
    TicketCommentCreate, TicketCommentResponse,
    # Analytics schemas
    DashboardStats, PipelineStage, ContactSummary, TicketStats
)

__all__ = [
    "WeakAreaResponse",
    "CoachingSessionResponse",
    "RepetitionResponse",
    "AnalyticsResponse",
    "RecommendationResponse",
    "SuccessResponse",
    "UpdateRecommendationRequest",
    "CompleteRepetitionRequest",
    # CRM schemas
    "CompanyCreate",
    "CompanyUpdate",
    "CompanyResponse",
    "ContactCreate",
    "ContactUpdate",
    "ContactResponse",
    "DealCreate",
    "DealUpdate",
    "DealResponse",
    "ActivityCreate",
    "ActivityUpdate",
    "ActivityResponse",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignResponse",
    "TicketCreate",
    "TicketUpdate",
    "TicketResponse",
    "TicketCommentCreate",
    "TicketCommentResponse",
    "DashboardStats",
    "PipelineStage",
    "ContactSummary",
    "TicketStats",
]
