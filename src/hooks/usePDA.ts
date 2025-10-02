/*
 * @ai-context
 * Role: Hook for PDA (Port Disbursement Account) operations - handles creation, updates,
 *       schema validation, rate limiting, and port validation.
 * DoD:
 * - Never alter database schema directly - use migrations.
 * - Always use tenant_id from activeOrg (via getActiveTenantId()) for multi-tenancy.
 * - Preserve RLS policy checks and rate limit validations.
 * - Maintain structured error handling with PDA_ERROR_CODES.
 * - Support both authenticated (user-based) and public (session-based) PDA creation.
 * Constraints:
 * - If altering validation rules, sync with pdaValidation.ts and schemas.
 * - Do not remove rate limit checks for public PDA creation.
 * - Preserve retry logic for network errors.
 * - Maintain audit trail (created_by, session_id).
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ensureAuth } from "@/hooks/useEnsureAuth";
import { PDAInputSchema, PDAUpdateSchema, type PDAInputData } from "@/schemas/pdaInputSchema";
import { validatePortTerminalBerth, createPDAError, logPDAError, PDA_ERROR_CODES } from "@/lib/pdaValidation";
import type { PDAStep1Data } from "@/schemas/pdaSchema";
import type { CostData } from "@/types";
import { useOrg } from "@/context/OrgProvider";
import { getActiveTenantId } from "@/lib/utils";

interface PDAData {
  shipData: Partial<PDAStep1Data> & {
    remarks?: string;
    comments?: Record<string, string>;
  };
  costData: Partial<CostData>;
}

export function usePDA(sessionId?: string) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { activeOrg } = useOrg();

  // @ai-editable:start(savePDA)
  const savePDA = async (data: PDAData, pdaId?: string, retryCount = 0) => {
    const MAX_RETRIES = 1;
    const RETRY_DELAYS = [300, 800]; // ms
    
    setLoading(true);
    
    try {
      // @ai-guard:start - tenant_id and auth logic
      // Step 1: Authentication (optional for public PDA creation)
      // Step 1a: Get user (optional for public mode)
      let user = null;
      let tenantId = getActiveTenantId(activeOrg);
      
      if (!sessionId) {
        // Authenticated mode - require user
        user = await ensureAuth();
        if (!user) {
          const authError = createPDAError('E_AUTH_ERROR', "User must be authenticated to create/update PDAs");
          logPDAError(authError, undefined, 'savePDA');
          throw authError;
        }
        // Always use activeOrg.id as tenant_id
        tenantId = getActiveTenantId(activeOrg);
      } else {
        // Public mode - use activeOrg if available
        tenantId = getActiveTenantId(activeOrg);
        
        // Rate limit check for public PDA creation
        if (!pdaId) { // Only check on creation, not updates
          const { data: rateLimitCheck, error: rateLimitError } = await supabase
            .rpc('check_pda_rate_limit', { 
              p_session_id: sessionId,
              p_max_requests: 20,
              p_time_window_hours: 1
            });
          
          if (rateLimitError) {
            console.error("Rate limit check error:", rateLimitError);
          } else if (rateLimitCheck) {
            const checkResult = rateLimitCheck as { allowed: boolean; message?: string; attempts: number; limit: number };
            if (!checkResult.allowed) {
              const rateLimitErrorObj = createPDAError(
                'E_AUTH_ERROR',
                checkResult.message || 'Rate limit exceeded. Please try again later.'
              );
              logPDAError(rateLimitErrorObj, undefined, 'savePDA');
              throw rateLimitErrorObj;
            }
          }
        }
      }
      // @ai-guard:end
      
      // Step 2: Transform and validate input data
      const inputData = {
        vessel: {
          name: data.shipData.vesselName || "",
          imo: data.shipData.imoNumber,
          dwt: data.shipData.dwt || "0",
          loa: data.shipData.loa || "0", 
          beam: data.shipData.beam || "0",
          draft: data.shipData.draft || "0"
        },
        portCargo: {
          port: data.shipData.portName || "",
          terminal: data.shipData.terminal,
          berths: data.shipData.berth ? [data.shipData.berth] : [],
          daysAlongside: data.shipData.daysAlongside || "0",
          cargo: data.shipData.cargo,
          quantity: data.shipData.quantity || "0"
        },
        from: data.shipData.from || "",
        to: data.shipData.to || "",
        toClientId: data.shipData.toClientId,
        date: data.shipData.date || new Date().toISOString(),
        exchangeRate: data.shipData.exchangeRate,
        exchangeRateSource: data.shipData.exchangeRateSource,
        exchangeRateSourceUrl: data.shipData.exchangeRateSourceUrl,
        exchangeRateTimestamp: data.shipData.exchangeRateTimestamp,
        status: 'CREATED' as const,
        costItems: {
          pilotage_in: data.costData.pilotageIn || 0,
          towage_in: data.costData.towageIn || 0,
          light_dues: data.costData.lightDues || 0,
          dockage: data.costData.dockage || 0,
          linesman: data.costData.linesman || 0,
          launch_boat: data.costData.launchBoat || 0,
          immigration: data.costData.immigration || 0,
          free_pratique: data.costData.freePratique || 0,
          shipping_association: data.costData.shippingAssociation || 0,
          clearance: data.costData.clearance || 0,
          paperless_port: data.costData.paperlessPort || 0,
          agency_fee: data.costData.agencyFee || 0,
          waterway: data.costData.waterway || 0
        },
        customLines: data.costData.customLines || [],
        remarks: data.shipData.remarks,
        comments: data.shipData.comments
      };
      
      // Step 3: Schema validation
      const validationResult = pdaId 
        ? PDAUpdateSchema.safeParse(inputData)
        : PDAInputSchema.safeParse(inputData);
        
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        const validationError = createPDAError(
          'E_PDA_VALIDATION',
          `Validation failed: ${firstError.message}`,
          firstError.path.join('.')
        );
        logPDAError(validationError, tenantId, 'savePDA', inputData);
        throw validationError;
      }
      
      const validatedData = validationResult.data;
      
      // Step 4: Port/Terminal/Berth validation (client-side guard)
      const portValidation = await validatePortTerminalBerth(
        validatedData.portCargo.port,
        validatedData.portCargo.terminal,
        validatedData.portCargo.berths
      );
      
      if (!portValidation.isValid && portValidation.error) {
        logPDAError(portValidation.error, tenantId, 'savePDA', inputData);
        throw portValidation.error;
      }
      
      // Step 5: Transform to database format
      const dbData = {
        tenant_id: tenantId,
        vessel_name: validatedData.vessel.name,
        imo_number: validatedData.vessel.imo,
        dwt: validatedData.vessel.dwt?.toString(),
        loa: validatedData.vessel.loa?.toString(),
        beam: validatedData.vessel.beam?.toString(),
        draft: validatedData.vessel.draft?.toString(),
        port_name: validatedData.portCargo.port,
        terminal: validatedData.portCargo.terminal,
        berth: validatedData.portCargo.berths?.[0] || null,
        berths: validatedData.portCargo.berths || [],
        days_alongside: validatedData.portCargo.daysAlongside?.toString(),
        cargo: validatedData.portCargo.cargo,
        quantity: validatedData.portCargo.quantity?.toString(),
        from_location: validatedData.from,
        to_location: validatedData.to,
        to_client_id: validatedData.toClientId,
        to_display_name: validatedData.to,
        date_field: validatedData.date,
        exchange_rate: validatedData.exchangeRate?.toString(),
        exchange_rate_source: validatedData.exchangeRateSource,
        exchange_rate_source_url: validatedData.exchangeRateSourceUrl,
        exchange_rate_timestamp: validatedData.exchangeRateTimestamp,
        status: validatedData.status,
        
        // Cost data
        pilotage_in: validatedData.costItems?.pilotage_in || 0,
        towage_in: validatedData.costItems?.towage_in || 0,
        light_dues: validatedData.costItems?.light_dues || 0,
        dockage: validatedData.costItems?.dockage || 0,
        linesman: validatedData.costItems?.linesman || 0,
        launch_boat: validatedData.costItems?.launch_boat || 0,
        immigration: validatedData.costItems?.immigration || 0,
        free_pratique: validatedData.costItems?.free_pratique || 0,
        shipping_association: validatedData.costItems?.shipping_association || 0,
        clearance: validatedData.costItems?.clearance || 0,
        paperless_port: validatedData.costItems?.paperless_port || 0,
        agency_fee: validatedData.costItems?.agency_fee || 0,
        waterway: validatedData.costItems?.waterway || 0,
        
        // Additional fields
        remarks: validatedData.remarks,
        comments: validatedData.comments ? JSON.stringify(validatedData.comments) : null,
        custom_lines: validatedData.customLines ? JSON.stringify(validatedData.customLines) : null,
      };

      let result;
      
      // Step 6: Database transaction
      if (pdaId) {
        // Update existing PDA
        let updateQuery = supabase
          .from("pdas")
          .update(dbData)
          .eq("id", pdaId);
        
        // For public mode (sessionId present and tenantId null), ensure we only update PDAs created by this session
        if (sessionId && !tenantId) {
          updateQuery = updateQuery.eq("created_by_session_id", sessionId);
        }
        
        result = await updateQuery.select().maybeSingle();
        
        // Handle case where no rows were updated (RLS prevented it or PDA not found)
        if (!result.data && !result.error) {
          const updateError = createPDAError(
            'E_AUTH_ERROR',
            'Unable to update PDA. You may not have permission to modify this document.'
          );
          logPDAError(updateError, tenantId, 'savePDA', inputData);
          throw updateError;
        }
      } else {
        // Create new PDA with generated PDA number
        const { data: pdaNumber, error: numberError } = await supabase
          .rpc("generate_pda_number", { p_tenant_id: tenantId });
          
        if (numberError) {
          const dbError = createPDAError('E_DB_CONSTRAINT', `Failed to generate PDA number: ${numberError.message}`);
          logPDAError(dbError, tenantId, 'savePDA', inputData);
          throw dbError;
        }
        
        const insertData = {
          ...dbData,
          pda_number: pdaNumber,
          created_by: tenantId,
          created_by_session_id: sessionId || null
        };
        
        result = await supabase
          .from("pdas")
          .insert([insertData])
          .select()
          .single();
      }

      if (result.error) {
        let errorCode = 'E_DB_CONSTRAINT';
        if (result.error.message?.includes('enum')) {
          errorCode = 'E_ENUM_MISMATCH';
        }
        
        const dbError = createPDAError(errorCode as any, `Database operation failed: ${result.error.message}`);
        logPDAError(dbError, tenantId, 'savePDA', inputData);
        throw dbError;
      }

      toast({
        title: "Success",
        description: pdaId ? "PDA updated successfully" : "PDA created successfully",
      });

      return result.data;
      
    } catch (error: any) {
      // Handle network errors with retry
      if (error.message?.includes('network') || error.message?.includes('fetch') || error.code === 'E_NETWORK_ERROR') {
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount];
          await new Promise(resolve => setTimeout(resolve, delay));
          return savePDA(data, pdaId, retryCount + 1);
        }
      }
      
      // Handle structured PDA errors
      if (error.errorId) {
        toast({
          title: "Error", 
          description: `Failed to save PDA (ID: ${error.errorId}). ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }
      
      // Handle unknown errors
      const unknownError = createPDAError('E_UNKNOWN', `Unexpected error: ${error.message}`);
      logPDAError(unknownError, undefined, 'savePDA');
      
      toast({
        title: "Error",
        description: `Failed to save PDA (ID: ${unknownError.errorId}). Please try again.`,
        variant: "destructive",
      });
      
      throw unknownError;
    } finally {
      setLoading(false);
    }
  };
  // @ai-editable:end

  const getPDA = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pdas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching PDA:", error);
      toast({
        title: "Error",
        description: "Error loading PDA",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    savePDA,
    getPDA,
    loading,
  };
}