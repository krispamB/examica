-- Authentication utility functions
-- Run this script in your Supabase SQL Editor

-- Function to confirm user email (admin only)
CREATE OR REPLACE FUNCTION admin_confirm_user_email(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
BEGIN
    -- Confirm the user's email in the auth.users table
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = user_id 
    AND email_confirmed_at IS NULL;
    
    -- If no rows were updated, the user might already be confirmed or not exist
    IF NOT FOUND THEN
        RAISE NOTICE 'User % was not found or email already confirmed', user_id;
    END IF;
END;
$$;

-- Function to get invitation by token (used in invitation acceptance)
CREATE OR REPLACE FUNCTION get_invitation_by_token(token TEXT)
RETURNS TABLE(
    id UUID,
    email TEXT,
    role TEXT,
    invited_by UUID,
    expires_at TIMESTAMPTZ,
    status TEXT,
    user_metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.email,
        ui.role::TEXT,
        ui.invited_by,
        ui.expires_at,
        ui.status::TEXT,
        ui.user_metadata
    FROM user_invitations ui
    WHERE ui.invitation_token = token
      AND ui.status = 'pending'
      AND ui.expires_at > NOW();
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO authenticated;