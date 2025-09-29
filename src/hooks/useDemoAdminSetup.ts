import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDemoAdminSetup() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const setupDemoAdmin = async () => {
      try {
        console.log('Setting up demo admin...');
        
        const { data, error } = await supabase.functions.invoke('setup-demo-admin');
        
        if (error) {
          console.error('Demo admin setup error:', error);
          throw error;
        }

        console.log('Demo admin setup response:', data);
        
        if (data?.success) {
          setIsSetupComplete(true);
          toast({
            title: "✅ Sistema Configurado",
            description: "Conta demo admin está disponível para login",
          });
        } else {
          throw new Error(data?.error || 'Failed to setup demo admin');
        }
      } catch (error) {
        console.error('Error setting up demo admin:', error);
        toast({
          title: "⚠️ Aviso",
          description: "Configuração demo admin falhou - contate o suporte",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    setupDemoAdmin();
  }, [toast]);

  return {
    isSetupComplete,
    isLoading
  };
}