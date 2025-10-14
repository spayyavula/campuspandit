-- Fix: Add DELETE policy for CRM contacts
-- Users were unable to delete contacts because no DELETE policy existed

-- Add DELETE policy for contacts
CREATE POLICY "Users can delete their contacts"
    ON crm_contacts FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- Also add DELETE policies for other CRM tables for consistency
CREATE POLICY "Users can delete their companies"
    ON crm_companies FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete their deals"
    ON crm_deals FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete their activities"
    ON crm_activities FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete their tasks"
    ON crm_tasks FOR DELETE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can delete their tickets"
    ON crm_tickets FOR DELETE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can delete their notes"
    ON crm_notes FOR DELETE
    USING (auth.uid() = created_by);
