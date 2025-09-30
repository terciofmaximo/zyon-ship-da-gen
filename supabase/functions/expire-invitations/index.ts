import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting invitation expiration job...');

    // Mark expired invitations
    const { data: expiredInvitations, error: selectError } = await supabaseClient
      .from('invitations')
      .select('id, email, expires_at')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (selectError) {
      console.error('Error selecting expired invitations:', selectError);
      throw selectError;
    }

    if (!expiredInvitations || expiredInvitations.length === 0) {
      console.log('No expired invitations found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired invitations found',
          expired_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredInvitations.length} expired invitations`);

    // Update status to expired
    const { error: updateError } = await supabaseClient
      .from('invitations')
      .update({ status: 'expired' })
      .in('id', expiredInvitations.map(inv => inv.id));

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      throw updateError;
    }

    console.log(`Successfully expired ${expiredInvitations.length} invitations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Expired ${expiredInvitations.length} invitations`,
        expired_count: expiredInvitations.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in expire-invitations function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});