import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useSeedPlatformAdmin() {
  const [loading, setLoading] = useState(false);

  const seedAdmin = async () => {
    setLoading(true);
    try {
      console.log('Invoking seed-platform-admin function...');
      
      const { data, error } = await supabase.functions.invoke('seed-platform-admin', {
        body: {},
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      console.log('Function response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to seed platform admin');
      }

      toast({
        title: 'Success',
        description: `Platform admin seeded successfully. User ID: ${data.userId}`,
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
