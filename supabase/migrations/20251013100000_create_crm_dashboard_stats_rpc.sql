-- =====================================================
-- Create get_crm_dashboard_stats RPC Function
-- This function returns aggregated statistics for the CRM dashboard
-- =====================================================

CREATE OR REPLACE FUNCTION get_crm_dashboard_stats(user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_contacts BIGINT,
  total_deals BIGINT,
  pending_tasks BIGINT,
  open_tickets BIGINT,
  total_revenue NUMERIC,
  deals_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total contacts count
    (SELECT COUNT(*)::BIGINT FROM crm_contacts
     WHERE user_id IS NULL OR owner_id = user_id OR created_by = user_id) as total_contacts,

    -- Active deals count (not closed)
    (SELECT COUNT(*)::BIGINT FROM crm_deals
     WHERE (user_id IS NULL OR owner_id = user_id OR created_by = user_id)
     AND is_closed = false) as total_deals,

    -- Pending tasks count
    (SELECT COUNT(*)::BIGINT FROM crm_tasks
     WHERE (user_id IS NULL OR assigned_to = user_id OR created_by = user_id)
     AND status = 'todo') as pending_tasks,

    -- Open tickets count
    (SELECT COUNT(*)::BIGINT FROM crm_tickets
     WHERE (user_id IS NULL OR assigned_to = user_id OR created_by = user_id)
     AND status IN ('open', 'in_progress')) as open_tickets,

    -- Total revenue from won deals
    (SELECT COALESCE(SUM(amount), 0) FROM crm_deals
     WHERE (user_id IS NULL OR owner_id = user_id OR created_by = user_id)
     AND is_won = true) as total_revenue,

    -- Deals created this month
    (SELECT COUNT(*)::BIGINT FROM crm_deals
     WHERE (user_id IS NULL OR owner_id = user_id OR created_by = user_id)
     AND created_at >= DATE_TRUNC('month', NOW())) as deals_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_crm_dashboard_stats(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_crm_dashboard_stats(UUID) IS 'Returns aggregated CRM dashboard statistics for a specific user or all users if user_id is NULL';
