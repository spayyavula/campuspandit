"""
Comprehensive CRM endpoints for contacts, companies, deals, activities, tasks, campaigns, and tickets.
All queries use eager loading with selectinload to prevent lazy-loading issues.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, case
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.crm import (
    CRMContact, CRMCompany, CRMDeal, CRMActivity, CRMTask,
    CRMCampaign, CRMTicket, CRMTicketComment,
    ContactType, ContactStatus, DealStage, TaskStatus, TicketStatus
)
from app.schemas.crm import (
    ContactCreate, ContactUpdate, ContactResponse,
    CompanyCreate, CompanyUpdate, CompanyResponse,
    DealCreate, DealUpdate, DealResponse,
    ActivityCreate, ActivityUpdate, ActivityResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    CampaignCreate, CampaignUpdate, CampaignResponse,
    TicketCreate, TicketUpdate, TicketResponse,
    TicketCommentCreate, TicketCommentResponse,
    DashboardStats, PipelineStage, ContactSummary, TicketStats
)

logger = logging.getLogger(__name__)
router = APIRouter()


# =====================================================
# CONTACTS ENDPOINTS
# =====================================================

@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(
    contact_type: Optional[ContactType] = None,
    status: Optional[ContactStatus] = None,
    owner_id: Optional[UUID] = None,
    search: Optional[str] = None,
    order_by: str = "created_at",
    ascending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all contacts with optional filters and eager-loaded company relationship."""
    try:
        # Build query with eager loading
        query = select(CRMContact).options(
            selectinload(CRMContact.company)
        )

        # Apply filters
        if contact_type:
            query = query.where(CRMContact.contact_type == contact_type)
        if status:
            query = query.where(CRMContact.status == status)
        if owner_id:
            query = query.where(CRMContact.owner_id == owner_id)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    CRMContact.first_name.ilike(search_pattern),
                    CRMContact.last_name.ilike(search_pattern),
                    CRMContact.email.ilike(search_pattern)
                )
            )

        # Apply ordering
        order_column = getattr(CRMContact, order_by, CRMContact.created_at)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        contacts = result.scalars().all()

        logger.info(f"Retrieved {len(contacts)} contacts")
        return contacts
    except Exception as e:
        logger.error(f"Error fetching contacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single contact by ID with eager-loaded company relationship."""
    try:
        result = await db.execute(
            select(CRMContact)
            .where(CRMContact.id == contact_id)
            .options(selectinload(CRMContact.company))
        )
        contact = result.scalar_one_or_none()

        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

        return contact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contact {contact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contacts", response_model=ContactResponse)
async def create_contact(
    contact_data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new contact."""
    try:
        # Create contact
        contact = CRMContact(
            **contact_data.model_dump(exclude={'owner_id'}),
            created_by=current_user.id,
            owner_id=contact_data.owner_id or current_user.id
        )

        db.add(contact)
        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMContact)
            .where(CRMContact.id == contact.id)
            .options(selectinload(CRMContact.company))
        )
        contact = result.scalar_one()

        logger.info(f"Created contact {contact.id}")
        return contact
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a contact."""
    try:
        # Get contact
        result = await db.execute(
            select(CRMContact).where(CRMContact.id == contact_id)
        )
        contact = result.scalar_one_or_none()

        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

        # Update fields
        update_data = contact_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)

        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMContact)
            .where(CRMContact.id == contact_id)
            .options(selectinload(CRMContact.company))
        )
        contact = result.scalar_one()

        logger.info(f"Updated contact {contact_id}")
        return contact
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating contact {contact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a contact."""
    try:
        result = await db.execute(
            select(CRMContact).where(CRMContact.id == contact_id)
        )
        contact = result.scalar_one_or_none()

        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

        await db.delete(contact)
        await db.commit()

        logger.info(f"Deleted contact {contact_id}")
        return {"message": "Contact deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting contact {contact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# COMPANIES ENDPOINTS
# =====================================================

@router.get("/companies", response_model=List[CompanyResponse])
async def get_companies(
    status: Optional[str] = None,
    owner_id: Optional[UUID] = None,
    search: Optional[str] = None,
    order_by: str = "created_at",
    ascending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all companies with optional filters."""
    try:
        query = select(CRMCompany)

        if status:
            query = query.where(CRMCompany.status == status)
        if owner_id:
            query = query.where(CRMCompany.owner_id == owner_id)
        if search:
            query = query.where(CRMCompany.name.ilike(f"%{search}%"))

        order_column = getattr(CRMCompany, order_by, CRMCompany.created_at)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        companies = result.scalars().all()

        logger.info(f"Retrieved {len(companies)} companies")
        return companies
    except Exception as e:
        logger.error(f"Error fetching companies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/companies", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new company."""
    try:
        company = CRMCompany(
            **company_data.model_dump(exclude={'owner_id'}),
            created_by=current_user.id,
            owner_id=company_data.owner_id or current_user.id
        )

        db.add(company)
        await db.commit()
        await db.refresh(company)

        logger.info(f"Created company {company.id}")
        return company
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating company: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a company."""
    try:
        result = await db.execute(
            select(CRMCompany).where(CRMCompany.id == company_id)
        )
        company = result.scalar_one_or_none()

        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        update_data = company_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)

        await db.commit()
        await db.refresh(company)

        logger.info(f"Updated company {company_id}")
        return company
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating company {company_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# DEALS ENDPOINTS
# =====================================================

@router.get("/deals", response_model=List[DealResponse])
async def get_deals(
    stage: Optional[DealStage] = None,
    owner_id: Optional[UUID] = None,
    is_closed: Optional[bool] = None,
    order_by: str = "created_at",
    ascending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all deals with eager-loaded contact and company relationships."""
    try:
        query = select(CRMDeal).options(
            selectinload(CRMDeal.contact),
            selectinload(CRMDeal.company)
        )

        if stage:
            query = query.where(CRMDeal.stage == stage)
        if owner_id:
            query = query.where(CRMDeal.owner_id == owner_id)
        if is_closed is not None:
            query = query.where(CRMDeal.is_closed == is_closed)

        order_column = getattr(CRMDeal, order_by, CRMDeal.created_at)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        deals = result.scalars().all()

        logger.info(f"Retrieved {len(deals)} deals")
        return deals
    except Exception as e:
        logger.error(f"Error fetching deals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single deal by ID with eager-loaded relationships."""
    try:
        result = await db.execute(
            select(CRMDeal)
            .where(CRMDeal.id == deal_id)
            .options(
                selectinload(CRMDeal.contact),
                selectinload(CRMDeal.company)
            )
        )
        deal = result.scalar_one_or_none()

        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        return deal
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching deal {deal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deals", response_model=DealResponse)
async def create_deal(
    deal_data: DealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new deal."""
    try:
        deal = CRMDeal(
            **deal_data.model_dump(exclude={'owner_id'}),
            created_by=current_user.id,
            owner_id=deal_data.owner_id or current_user.id
        )

        db.add(deal)
        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMDeal)
            .where(CRMDeal.id == deal.id)
            .options(
                selectinload(CRMDeal.contact),
                selectinload(CRMDeal.company)
            )
        )
        deal = result.scalar_one()

        logger.info(f"Created deal {deal.id}")
        return deal
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating deal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: UUID,
    deal_data: DealUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a deal."""
    try:
        result = await db.execute(
            select(CRMDeal).where(CRMDeal.id == deal_id)
        )
        deal = result.scalar_one_or_none()

        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        update_data = deal_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(deal, field, value)

        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMDeal)
            .where(CRMDeal.id == deal_id)
            .options(
                selectinload(CRMDeal.contact),
                selectinload(CRMDeal.company)
            )
        )
        deal = result.scalar_one()

        logger.info(f"Updated deal {deal_id}")
        return deal
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating deal {deal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/deals/{deal_id}")
async def delete_deal(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a deal."""
    try:
        result = await db.execute(
            select(CRMDeal).where(CRMDeal.id == deal_id)
        )
        deal = result.scalar_one_or_none()

        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        await db.delete(deal)
        await db.commit()

        logger.info(f"Deleted deal {deal_id}")
        return {"message": "Deal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting deal {deal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ACTIVITIES ENDPOINTS
# =====================================================

@router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(
    contact_id: Optional[UUID] = None,
    deal_id: Optional[UUID] = None,
    activity_type: Optional[str] = None,
    owner_id: Optional[UUID] = None,
    order_by: str = "created_at",
    ascending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all activities with eager-loaded relationships."""
    try:
        query = select(CRMActivity).options(
            selectinload(CRMActivity.contact),
            selectinload(CRMActivity.deal)
        )

        if contact_id:
            query = query.where(CRMActivity.contact_id == contact_id)
        if deal_id:
            query = query.where(CRMActivity.deal_id == deal_id)
        if activity_type:
            query = query.where(CRMActivity.activity_type == activity_type)
        if owner_id:
            query = query.where(CRMActivity.owner_id == owner_id)

        order_column = getattr(CRMActivity, order_by, CRMActivity.created_at)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        activities = result.scalars().all()

        logger.info(f"Retrieved {len(activities)} activities")
        return activities
    except Exception as e:
        logger.error(f"Error fetching activities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/activities", response_model=ActivityResponse)
async def create_activity(
    activity_data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new activity."""
    try:
        activity = CRMActivity(
            **activity_data.model_dump(exclude={'owner_id'}),
            created_by=current_user.id,
            owner_id=activity_data.owner_id or current_user.id
        )

        db.add(activity)
        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMActivity)
            .where(CRMActivity.id == activity.id)
            .options(
                selectinload(CRMActivity.contact),
                selectinload(CRMActivity.deal)
            )
        )
        activity = result.scalar_one()

        logger.info(f"Created activity {activity.id}")
        return activity
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: UUID,
    activity_data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an activity."""
    try:
        result = await db.execute(
            select(CRMActivity).where(CRMActivity.id == activity_id)
        )
        activity = result.scalar_one_or_none()

        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        update_data = activity_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(activity, field, value)

        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMActivity)
            .where(CRMActivity.id == activity_id)
            .options(
                selectinload(CRMActivity.contact),
                selectinload(CRMActivity.deal)
            )
        )
        activity = result.scalar_one()

        logger.info(f"Updated activity {activity_id}")
        return activity
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating activity {activity_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# TASKS ENDPOINTS
# =====================================================

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    assigned_to: Optional[UUID] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[str] = None,
    order_by: str = "due_date",
    ascending: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks with eager-loaded relationships."""
    try:
        query = select(CRMTask).options(
            selectinload(CRMTask.contact),
            selectinload(CRMTask.deal)
        )

        if assigned_to:
            query = query.where(CRMTask.assigned_to == assigned_to)
        if status:
            query = query.where(CRMTask.status == status)
        if priority:
            query = query.where(CRMTask.priority == priority)

        order_column = getattr(CRMTask, order_by, CRMTask.due_date)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        tasks = result.scalars().all()

        logger.info(f"Retrieved {len(tasks)} tasks")
        return tasks
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task."""
    try:
        task = CRMTask(
            **task_data.model_dump(exclude={'assigned_to'}),
            created_by=current_user.id,
            assigned_to=task_data.assigned_to or current_user.id
        )

        db.add(task)
        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMTask)
            .where(CRMTask.id == task.id)
            .options(
                selectinload(CRMTask.contact),
                selectinload(CRMTask.deal)
            )
        )
        task = result.scalar_one()

        logger.info(f"Created task {task.id}")
        return task
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task."""
    try:
        result = await db.execute(
            select(CRMTask).where(CRMTask.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMTask)
            .where(CRMTask.id == task_id)
            .options(
                selectinload(CRMTask.contact),
                selectinload(CRMTask.deal)
            )
        )
        task = result.scalar_one()

        logger.info(f"Updated task {task_id}")
        return task
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task."""
    try:
        result = await db.execute(
            select(CRMTask).where(CRMTask.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        await db.delete(task)
        await db.commit()

        logger.info(f"Deleted task {task_id}")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# CAMPAIGNS ENDPOINTS
# =====================================================

@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(
    campaign_type: Optional[str] = None,
    status: Optional[str] = None,
    order_by: str = "created_at",
    ascending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all campaigns."""
    try:
        query = select(CRMCampaign)

        if campaign_type:
            query = query.where(CRMCampaign.campaign_type == campaign_type)
        if status:
            query = query.where(CRMCampaign.status == status)

        order_column = getattr(CRMCampaign, order_by, CRMCampaign.created_at)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        campaigns = result.scalars().all()

        logger.info(f"Retrieved {len(campaigns)} campaigns")
        return campaigns
    except Exception as e:
        logger.error(f"Error fetching campaigns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new campaign."""
    try:
        campaign = CRMCampaign(
            **campaign_data.model_dump(),
            created_by=current_user.id,
            owner_id=current_user.id
        )

        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)

        logger.info(f"Created campaign {campaign.id}")
        return campaign
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: UUID,
    campaign_data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a campaign."""
    try:
        result = await db.execute(
            select(CRMCampaign).where(CRMCampaign.id == campaign_id)
        )
        campaign = result.scalar_one_or_none()

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        update_data = campaign_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(campaign, field, value)

        await db.commit()
        await db.refresh(campaign)

        logger.info(f"Updated campaign {campaign_id}")
        return campaign
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# TICKETS ENDPOINTS
# =====================================================

@router.get("/tickets", response_model=List[TicketResponse])
async def get_tickets(
    contact_id: Optional[UUID] = None,
    assigned_to: Optional[UUID] = None,
    status: Optional[TicketStatus] = None,
    priority: Optional[str] = None,
    order_by: str = "created_at",
    ascending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tickets with eager-loaded contact and comments relationships."""
    try:
        query = select(CRMTicket).options(
            selectinload(CRMTicket.contact),
            selectinload(CRMTicket.comments)
        )

        if contact_id:
            query = query.where(CRMTicket.contact_id == contact_id)
        if assigned_to:
            query = query.where(CRMTicket.assigned_to == assigned_to)
        if status:
            # Handle multiple statuses for frontend compatibility
            if ',' in str(status):
                statuses = [s.strip() for s in str(status).split(',')]
                query = query.where(CRMTicket.status.in_(statuses))
            else:
                query = query.where(CRMTicket.status == status)
        if priority:
            query = query.where(CRMTicket.priority == priority)

        order_column = getattr(CRMTicket, order_by, CRMTicket.created_at)
        query = query.order_by(order_column.asc() if ascending else order_column.desc())

        result = await db.execute(query)
        tickets = result.scalars().all()

        logger.info(f"Retrieved {len(tickets)} tickets")
        return tickets
    except Exception as e:
        logger.error(f"Error fetching tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single ticket by ID with eager-loaded relationships."""
    try:
        result = await db.execute(
            select(CRMTicket)
            .where(CRMTicket.id == ticket_id)
            .options(
                selectinload(CRMTicket.contact),
                selectinload(CRMTicket.comments)
            )
        )
        ticket = result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        return ticket
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tickets", response_model=TicketResponse)
async def create_ticket(
    ticket_data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new ticket with auto-incrementing ticket number."""
    try:
        # Get the next ticket number
        result = await db.execute(
            select(func.max(CRMTicket.ticket_number))
        )
        max_ticket_number = result.scalar()
        next_ticket_number = (max_ticket_number or 0) + 1

        ticket = CRMTicket(
            **ticket_data.model_dump(),
            ticket_number=next_ticket_number,
            created_by=current_user.id
        )

        db.add(ticket)
        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMTicket)
            .where(CRMTicket.id == ticket.id)
            .options(
                selectinload(CRMTicket.contact),
                selectinload(CRMTicket.comments)
            )
        )
        ticket = result.scalar_one()

        logger.info(f"Created ticket {ticket.id} with number {ticket.ticket_number}")
        return ticket
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: UUID,
    ticket_data: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a ticket."""
    try:
        result = await db.execute(
            select(CRMTicket).where(CRMTicket.id == ticket_id)
        )
        ticket = result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        update_data = ticket_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ticket, field, value)

        await db.commit()

        # Query back with relationships eagerly loaded
        result = await db.execute(
            select(CRMTicket)
            .where(CRMTicket.id == ticket_id)
            .options(
                selectinload(CRMTicket.contact),
                selectinload(CRMTicket.comments)
            )
        )
        ticket = result.scalar_one()

        logger.info(f"Updated ticket {ticket_id}")
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tickets/{ticket_id}/comments", response_model=TicketCommentResponse)
async def add_ticket_comment(
    ticket_id: UUID,
    comment_data: TicketCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a ticket."""
    try:
        # Verify ticket exists
        result = await db.execute(
            select(CRMTicket).where(CRMTicket.id == ticket_id)
        )
        ticket = result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        comment = CRMTicketComment(
            ticket_id=ticket_id,
            **comment_data.model_dump(),
            created_by=current_user.id
        )

        db.add(comment)
        await db.commit()
        await db.refresh(comment)

        logger.info(f"Added comment to ticket {ticket_id}")
        return comment
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error adding comment to ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ANALYTICS & DASHBOARD ENDPOINTS
# =====================================================

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    user_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics."""
    try:
        # Count queries
        contacts_result = await db.execute(select(func.count(CRMContact.id)))
        total_contacts = contacts_result.scalar()

        deals_result = await db.execute(
            select(func.count(CRMDeal.id)).where(CRMDeal.is_closed == False)
        )
        total_deals = deals_result.scalar()

        tasks_result = await db.execute(
            select(func.count(CRMTask.id)).where(CRMTask.status == TaskStatus.TODO)
        )
        pending_tasks = tasks_result.scalar()

        tickets_result = await db.execute(
            select(func.count(CRMTicket.id)).where(
                CRMTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
            )
        )
        open_tickets = tickets_result.scalar()

        # Calculate total revenue from won deals
        revenue_result = await db.execute(
            select(func.sum(CRMDeal.amount)).where(CRMDeal.is_won == True)
        )
        total_revenue = revenue_result.scalar() or 0.0

        # Count deals created this month
        from datetime import datetime, timedelta
        first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        deals_this_month_result = await db.execute(
            select(func.count(CRMDeal.id)).where(CRMDeal.created_at >= first_day_of_month)
        )
        deals_this_month = deals_this_month_result.scalar()

        stats = DashboardStats(
            total_contacts=total_contacts,
            total_deals=total_deals,
            pending_tasks=pending_tasks,
            open_tickets=open_tickets,
            total_revenue=total_revenue,
            deals_this_month=deals_this_month
        )

        logger.info("Retrieved dashboard stats")
        return stats
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deal-pipeline", response_model=List[PipelineStage])
async def get_deal_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get deal pipeline statistics grouped by stage."""
    try:
        result = await db.execute(
            select(
                CRMDeal.stage,
                func.count(CRMDeal.id).label('count'),
                func.sum(CRMDeal.amount).label('total_value')
            )
            .group_by(CRMDeal.stage)
        )

        pipeline = [
            PipelineStage(
                stage=row.stage.value,
                count=row.count,
                total_value=float(row.total_value or 0)
            )
            for row in result.all()
        ]

        logger.info("Retrieved deal pipeline stats")
        return pipeline
    except Exception as e:
        logger.error(f"Error fetching deal pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contact-summary", response_model=List[ContactSummary])
async def get_contact_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get contact summary statistics grouped by contact type."""
    try:
        result = await db.execute(
            select(
                CRMContact.contact_type,
                func.count(CRMContact.id).label('count')
            )
            .group_by(CRMContact.contact_type)
        )

        summary = [
            ContactSummary(
                contact_type=row.contact_type.value,
                count=row.count
            )
            for row in result.all()
        ]

        logger.info("Retrieved contact summary")
        return summary
    except Exception as e:
        logger.error(f"Error fetching contact summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ticket-stats", response_model=List[TicketStats])
async def get_ticket_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ticket statistics grouped by status."""
    try:
        result = await db.execute(
            select(
                CRMTicket.status,
                func.count(CRMTicket.id).label('count')
            )
            .group_by(CRMTicket.status)
        )

        stats = [
            TicketStats(
                status=row.status.value,
                count=row.count
            )
            for row in result.all()
        ]

        logger.info("Retrieved ticket stats")
        return stats
    except Exception as e:
        logger.error(f"Error fetching ticket stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
