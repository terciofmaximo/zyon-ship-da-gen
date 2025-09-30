import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInvitationCleanup = () => {
  const { toast } = useToast();

  const expireInvitations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('expire-invitations');
      
      if (error) {
        console.error('Error expiring invitations:', error);
        return;
      }

      if (data?.expired_count > 0) {
        console.log(`Expired ${data.expired_count} invitations`);
      }
    } catch (error) {
      console.error('Failed to expire invitations:', error);
    }
  };

  const manualExpireInvitations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('expire-invitations');
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to expire invitations",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: data?.expired_count > 0 
          ? `Expired ${data.expired_count} invitations` 
          : "No expired invitations found",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to expire invitations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Run cleanup on component mount
    expireInvitations();
  }, []);

  return { manualExpireInvitations };
};