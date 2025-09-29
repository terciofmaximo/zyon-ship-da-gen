import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useSeedPlatformAdmin() {
  const [loading, setLoading] = useState(false);

  const seedAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-platform-admin', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Platform admin seeded successfully',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to seed platform admin',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { seedAdmin, loading };
}
