import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FDALedger } from '@/types/fda';
import Decimal from 'decimal.js';

/**
 * FDA Ledger service hook
 * Encapsulates all FDA ledger-related database operations
 */
export function useFDALedgerService() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Add a new ledger line
   */
  const addLine = useCallback(async (params: {
    fdaId: string;
    lineNo: number;
    side: 'AP' | 'AR';
    tenantId: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fda_ledger')
        .insert({
          fda_id: params.fdaId,
          line_no: params.lineNo,
          side: params.side,
          category: 'New Item',
          description: 'New line item',
          counterparty: 'Vendor — to assign',
          amount_usd: 0,
          amount_local: 0,
          status: 'Open',
          tenant_id: params.tenantId,
          origin: 'MANUAL',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'New line added',
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error adding ledger line:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new line',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Update a ledger line field
   */
  const updateLineField = useCallback(async (params: {
    lineId: string;
    field: string;
    value: any;
    exchangeRate?: number;
  }) => {
    setLoading(true);
    try {
      const updates: Record<string, any> = { [params.field]: params.value };

      // If updating amount_usd and we have exchange rate, also update amount_local
      if (params.field === 'amount_usd' && params.exchangeRate) {
        const usdAmount = new Decimal(params.value || 0);
        const rate = new Decimal(params.exchangeRate);
        updates.amount_local = usdAmount.mul(rate).toNumber();
      }

      const { error } = await supabase
        .from('fda_ledger')
        .update(updates)
        .eq('id', params.lineId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating ledger line:', error);
      toast({
        title: 'Error',
        description: 'Failed to update line',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Delete a ledger line
   */
  const deleteLine = useCallback(async (lineId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fda_ledger')
        .delete()
        .eq('id', lineId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Line deleted',
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting ledger line:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete line',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Batch update amount_local for all lines when exchange rate changes
   */
  const recalculateAmountsLocal = useCallback(async (params: {
    fdaId: string;
    exchangeRate: number;
  }) => {
    setLoading(true);
    try {
      // Fetch all ledger lines for this FDA
      const { data: lines, error: fetchError } = await supabase
        .from('fda_ledger')
        .select('id, amount_usd')
        .eq('fda_id', params.fdaId);

      if (fetchError) throw fetchError;
      if (!lines || lines.length === 0) return { success: true };

      const rate = new Decimal(params.exchangeRate);

      // Update each line
      const updates = lines.map(line => {
        const usdAmount = new Decimal(line.amount_usd || 0);
        const localAmount = usdAmount.mul(rate).toNumber();

        return supabase
          .from('fda_ledger')
          .update({ amount_local: localAmount })
          .eq('id', line.id);
      });

      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      console.error('Error recalculating amounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate amounts',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Fetch all ledger lines for an FDA
   */
  const fetchLines = useCallback(async (fdaId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fda_ledger')
        .select('*')
        .eq('fda_id', fdaId)
        .order('line_no', { ascending: true });

      if (error) throw error;

      return { success: true, data: data as FDALedger[] };
    } catch (error) {
      console.error('Error fetching ledger lines:', error);
      return { success: false, error, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addLine,
    updateLineField,
    deleteLine,
    recalculateAmountsLocal,
    fetchLines,
    loading,
  };
}
