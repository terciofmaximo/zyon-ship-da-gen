import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useResetAdminPassword() {
  const [loading, setLoading] = useState(false);

  const resetAdminPassword = async () => {
    setLoading(true);
    try {
      console.log('Resetting admin password...');
      
      const { data, error } = await supabase.functions.invoke('reset-admin-password', {
        body: {},
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      console.log('Reset function response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset admin password');
      }

      toast({
        title: 'Sucesso',
        description: 'Senha do admin foi resetada. Tente fazer login agora.',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao resetar senha do admin',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { resetAdminPassword, loading };
}