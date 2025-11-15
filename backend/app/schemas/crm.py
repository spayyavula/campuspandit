"""
CRM Pydantic schemas for validation and serialization.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.crm import (
    ContactType, ContactStatus, CompanyStatus, DealStage,
    ActivityType, ActivityStatus, TaskStatus, Priority,
    CampaignType, CampaignStatus, TicketStatus
)


# =====================================================
# COMPANY SCHEMAS
# =====================================================

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: CompanyStatus = CompanyStatus.PROSPECT
    owner_id: Optional[UUID] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    status: Optional[CompanyStatus] = None
    owner_id: Optional[UUID] = None


class CompanyResponse(CompanyBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# CONTACT SCHEMAS
# =====================================================

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    contact_type: ContactType = ContactType.LEAD
    status: ContactStatus = ContactStatus.NEW
    company_id: Optional[UUID] = None
    job_title: Optional[str] = None
    source: Optional[str] = None
    lead_score: Optional[int] = 0
    owner_id: Optional[UUID] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    contact_type: Optional[ContactType] = None
    status: Optional[ContactStatus] = None
    company_id: Optional[UUID] = None
    job_title: Optional[str] = None
    source: Optional[str] = None
    lead_score: Optional[int] = None
    owner_id: Optional[UUID] = None
    tags: Optional[List[str]] = None


class ContactResponse(ContactBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyResponse] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# DEAL SCHEMAS
# =====================================================

class DealBase(BaseModel):
    name: str
    contact_id: UUID
    company_id: Optional[UUID] = None
    owner_id: UUID
    amount: float = 0.0
    stage: DealStage = DealStage.PROSPECTING
    probability: int = 0
    expected_close_date: Optional[datetime] = None
    is_closed: bool = False
    is_won: bool = False


class DealCreate(BaseModel):
    name: str
    contact_id: UUID
    company_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None  # Will default to current user
    amount: float = 0.0
    stage: DealStage = DealStage.PROSPECTING
    probability: int = 0
    expected_close_date: Optional[datetime] = None


class DealUpdate(BaseModel):
    name: Optional[str] = None
    contact_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    amount: Optional[float] = None
    stage: Optional[DealStage] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    is_closed: Optional[bool] = None
    is_won: Optional[bool] = None


class ContactInfo(BaseModel):
    first_name: str
    last_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class CompanyInfo(BaseModel):
    name: str

    model_config = ConfigDict(from_attributes=True)


class DealResponse(DealBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    contact: Optional[ContactInfo] = None
    company: Optional[CompanyInfo] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# ACTIVITY SCHEMAS
# =====================================================

class ActivityBase(BaseModel):
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    owner_id: UUID
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: ActivityStatus = ActivityStatus.SCHEDULED


class ActivityCreate(BaseModel):
    activity_type: ActivityType
    subject: str
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None  # Will default to current user
    scheduled_at: Optional[datetime] = None
    status: ActivityStatus = ActivityStatus.SCHEDULED


class ActivityUpdate(BaseModel):
    activity_type: Optional[ActivityType] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: Optional[ActivityStatus] = None


class DealInfo(BaseModel):
    name: str

    model_config = ConfigDict(from_attributes=True)


class ActivityResponse(ActivityBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    contact: Optional[ContactInfo] = None
    deal: Optional[DealInfo] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# TASK SCHEMAS
# =====================================================

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    assigned_to: UUID
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[datetime] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None  # Will default to current user
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    contact: Optional[ContactInfo] = None
    deal: Optional[DealInfo] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# CAMPAIGN SCHEMAS
# =====================================================

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    campaign_type: CampaignType
    status: CampaignStatus = CampaignStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_sent: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    owner_id: UUID


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    campaign_type: CampaignType
    status: CampaignStatus = CampaignStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    status: Optional[CampaignStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_sent: Optional[int] = None
    total_opened: Optional[int] = None
    total_clicked: Optional[int] = None


class CampaignResponse(CampaignBase):
    id: UUID
    created_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# TICKET SCHEMAS
# =====================================================

class TicketCommentBase(BaseModel):
    comment: str
    is_public: bool = True


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentResponse(TicketCommentBase):
    id: UUID
    ticket_id: UUID
    created_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketBase(BaseModel):
    subject: str
    description: str
    contact_id: UUID
    assigned_to: Optional[UUID] = None
    category: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    satisfaction_rating: Optional[int] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    category: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TicketStatus] = None
    satisfaction_rating: Optional[int] = None


class TicketResponse(TicketBase):
    id: UUID
    ticket_number: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    contact: ContactInfo
    comments: Optional[List[TicketCommentResponse]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# ANALYTICS & DASHBOARD SCHEMAS
# =====================================================

class DashboardStats(BaseModel):
    total_contacts: int
    total_deals: int
    pending_tasks: int
    open_tickets: int
    total_revenue: float
    deals_this_month: int


class PipelineStage(BaseModel):
    stage: str
    count: int
    total_value: float


class ContactSummary(BaseModel):
    contact_type: str
    count: int


class TicketStats(BaseModel):
    status: str
    count: int
