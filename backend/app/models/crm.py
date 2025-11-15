"""
CRM database models for contacts, companies, deals, activities, tasks, campaigns, and tickets.
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


# Enums
class ContactType(str, enum.Enum):
    LEAD = "lead"
    CUSTOMER = "customer"
    PARTNER = "partner"
    VENDOR = "vendor"


class ContactStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CUSTOMER = "customer"
    INACTIVE = "inactive"


class CompanyStatus(str, enum.Enum):
    PROSPECT = "prospect"
    CUSTOMER = "customer"
    PARTNER = "partner"
    INACTIVE = "inactive"


class DealStage(str, enum.Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(str, enum.Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    SMS = "sms"
    WHATSAPP = "whatsapp"


class ActivityStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CampaignType(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    SOCIAL_MEDIA = "social_media"
    WEBINAR = "webinar"
    EVENT = "event"
    CONTENT = "content"
    PAID_ADS = "paid_ads"


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_CUSTOMER = "waiting_customer"
    WAITING_INTERNAL = "waiting_internal"
    RESOLVED = "resolved"
    CLOSED = "closed"
    CANCELLED = "cancelled"


# Models
class CRMCompany(Base):
    """CRM Company model."""
    __tablename__ = "crm_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    website = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    industry = Column(String(100))
    company_size = Column(String(50))
    status = Column(SQLEnum(CompanyStatus), nullable=False, default=CompanyStatus.PROSPECT)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    contacts = relationship("CRMContact", back_populates="company")
    deals = relationship("CRMDeal", back_populates="company")
    activities = relationship("CRMActivity", back_populates="company")
    owner = relationship("User", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])


class CRMContact(Base):
    """CRM Contact model."""
    __tablename__ = "crm_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50))
    mobile = Column(String(50))
    contact_type = Column(SQLEnum(ContactType), nullable=False, default=ContactType.LEAD)
    status = Column(SQLEnum(ContactStatus), nullable=False, default=ContactStatus.NEW)
    company_id = Column(UUID(as_uuid=True), ForeignKey("crm_companies.id"), nullable=True)
    job_title = Column(String(100))
    source = Column(String(100))
    lead_score = Column(Integer, default=0)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tags = Column(ARRAY(String), default=list)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    company = relationship("CRMCompany", back_populates="contacts")
    deals = relationship("CRMDeal", back_populates="contact")
    activities = relationship("CRMActivity", back_populates="contact")
    tasks = relationship("CRMTask", back_populates="contact")
    tickets = relationship("CRMTicket", back_populates="contact")
    owner = relationship("User", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])


class CRMDeal(Base):
    """CRM Deal model."""
    __tablename__ = "crm_deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("crm_contacts.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("crm_companies.id"), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    stage = Column(SQLEnum(DealStage), nullable=False, default=DealStage.PROSPECTING)
    probability = Column(Integer, nullable=False, default=0)
    expected_close_date = Column(DateTime(timezone=True), nullable=True)
    is_closed = Column(Boolean, nullable=False, default=False)
    is_won = Column(Boolean, nullable=False, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    contact = relationship("CRMContact", back_populates="deals")
    company = relationship("CRMCompany", back_populates="deals")
    activities = relationship("CRMActivity", back_populates="deal")
    tasks = relationship("CRMTask", back_populates="deal")
    owner = relationship("User", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])


class CRMActivity(Base):
    """CRM Activity model."""
    __tablename__ = "crm_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_type = Column(SQLEnum(ActivityType), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("crm_contacts.id"), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("crm_companies.id"), nullable=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("crm_deals.id"), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(ActivityStatus), nullable=False, default=ActivityStatus.SCHEDULED)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    contact = relationship("CRMContact", back_populates="activities")
    company = relationship("CRMCompany", back_populates="activities")
    deal = relationship("CRMDeal", back_populates="activities")
    owner = relationship("User", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])


class CRMTask(Base):
    """CRM Task model."""
    __tablename__ = "crm_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("crm_contacts.id"), nullable=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("crm_deals.id"), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    priority = Column(SQLEnum(Priority), nullable=False, default=Priority.MEDIUM)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    contact = relationship("CRMContact", back_populates="tasks")
    deal = relationship("CRMDeal", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])


class CRMCampaign(Base):
    """CRM Campaign model."""
    __tablename__ = "crm_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    campaign_type = Column(SQLEnum(CampaignType), nullable=False)
    status = Column(SQLEnum(CampaignStatus), nullable=False, default=CampaignStatus.DRAFT)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    total_sent = Column(Integer, nullable=False, default=0)
    total_opened = Column(Integer, nullable=False, default=0)
    total_clicked = Column(Integer, nullable=False, default=0)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])


class CRMTicket(Base):
    """CRM Ticket model."""
    __tablename__ = "crm_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(Integer, nullable=False, unique=True, index=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("crm_contacts.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    category = Column(String(100))
    priority = Column(SQLEnum(Priority), nullable=False, default=Priority.MEDIUM)
    status = Column(SQLEnum(TicketStatus), nullable=False, default=TicketStatus.OPEN)
    satisfaction_rating = Column(Integer, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    contact = relationship("CRMContact", back_populates="tickets")
    comments = relationship("CRMTicketComment", back_populates="ticket", cascade="all, delete-orphan")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])


class CRMTicketComment(Base):
    """CRM Ticket Comment model."""
    __tablename__ = "crm_ticket_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("crm_tickets.id", ondelete="CASCADE"), nullable=False)
    comment = Column(Text, nullable=False)
    is_public = Column(Boolean, nullable=False, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    ticket = relationship("CRMTicket", back_populates="comments")
    creator = relationship("User", foreign_keys=[created_by])
