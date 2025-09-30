-- Fix infinite recursion in memberships RLS policy
-- The issue is that the policy is trying to query the same table it's protecting

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view memberships from their organizations" ON memberships;

-- Create a corrected policy that doesn't cause recursion
-- Platform admins can see all, regular users can only see memberships from their own companies
CREATE POLICY "Users can view memberships from their organizations"
ON memberships
FOR SELECT
USING (
  has_role(auth.uid(), 'platformAdmin'::app_role) OR
  (
    -- Check if user has access to this company through organization_members
    company_id IN (
      SELECT organizations.id 
      FROM organizations
      INNER JOIN organization_members ON organizations.id = organization_members.org_id
      WHERE organization_members.user_id = auth.uid()
    )
  )
);

-- Also fix the ALL policy for memberships that has the same issue
DROP POLICY IF EXISTS "Organization owners/admins can manage memberships" ON memberships;

CREATE POLICY "Organization owners/admins can manage memberships"
ON memberships
FOR ALL
USING (
  has_role(auth.uid(), 'platformAdmin'::app_role) OR
  (
    -- Check if user is admin/owner of the organization
    company_id IN (
      SELECT organizations.id 
      FROM organizations
      INNER JOIN organization_members ON organizations.id = organization_members.org_id
      WHERE organization_members.user_id = auth.uid() 
        AND organization_members.role IN ('owner', 'admin')
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'platformAdmin'::app_role) OR
  (
    -- Check if user is admin/owner of the organization
    company_id IN (
      SELECT organizations.id 
      FROM organizations
      INNER JOIN organization_members ON organizations.id = organization_members.org_id
      WHERE organization_members.user_id = auth.uid() 
        AND organization_members.role IN ('owner', 'admin')
    )
  )
);