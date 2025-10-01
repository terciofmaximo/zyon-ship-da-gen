import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type InvitationRole = 'admin' | 'member' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface TeamMember {
  id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  user_email?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: InvitationRole;
  token: string;
  expires_at: string;
  status: InvitationStatus;
  created_at: string;
}

/**
 * Team management service hook
 * Encapsulates all team/member/invitation operations
 */
export function useTeamService() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Fetch team members for a company/organization
   */
  const fetchMembers = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each member
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: userData } = await supabase.auth.admin.getUserById(
            member.user_id
          );
          return {
            ...member,
            user_email: userData?.user?.email,
          };
        })
      );

      return { success: true, data: membersWithEmails as TeamMember[] };
    } catch (error) {
      console.error('Error fetching members:', error);
      return { success: false, error, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch invitations for a company/organization
   */
  const fetchInvitations = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data as TeamInvitation[] };
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return { success: false, error, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new invitation
   */
  const createInvitation = useCallback(async (params: {
    companyId: string;
    email: string;
    role: InvitationRole;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          company_id: params.companyId,
          email: params.email.toLowerCase().trim(),
          role: params.role,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Invitation sent to ${params.email}`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      
      const errorMessage = error.message?.includes('unique')
        ? 'An invitation for this email already exists'
        : 'Failed to send invitation';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Revoke/delete an invitation
   */
  const revokeInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation revoked',
      });

      return { success: true };
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke invitation',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Update a member's role
   */
  const updateMemberRole = useCallback(async (params: {
    memberId: string;
    role: MemberRole;
  }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: params.role })
        .eq('id', params.memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member role updated',
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Remove a member from the team
   */
  const removeMember = useCallback(async (memberId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed from team',
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    fetchMembers,
    fetchInvitations,
    createInvitation,
    revokeInvitation,
    updateMemberRole,
    removeMember,
    loading,
  };
}
