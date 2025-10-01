-- Create fda-attachments bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fda-attachments', 'fda-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can view attachments from their organizations
CREATE POLICY "Users can view attachments from their orgs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fda-attachments' 
  AND (
    (SPLIT_PART(name, '/', 1))::uuid IN (
      SELECT get_user_org_ids(auth.uid())
    )
    OR has_role(auth.uid(), 'platformAdmin'::app_role)
  )
);

-- RLS Policy: Users can upload attachments to their organizations
CREATE POLICY "Users can upload attachments to their orgs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fda-attachments'
  AND (
    (SPLIT_PART(name, '/', 1))::uuid IN (
      SELECT get_user_org_ids(auth.uid())
    )
    OR has_role(auth.uid(), 'platformAdmin'::app_role)
  )
);

-- RLS Policy: Users can delete attachments from their organizations
CREATE POLICY "Users can delete attachments from their orgs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fda-attachments'
  AND (
    (SPLIT_PART(name, '/', 1))::uuid IN (
      SELECT get_user_org_ids(auth.uid())
    )
    OR has_role(auth.uid(), 'platformAdmin'::app_role)
  )
);