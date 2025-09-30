import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Resetting admin password...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const adminEmail = 'contact@vesselopsportal.com';
    const adminPassword = 'Admin123!';

    // Update the user password
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      '430101ca-1f9a-4b69-8c18-78eac920226c',
      {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Platform Admin',
          email_verified: true
        }
      }
    );

    if (updateError) {
      console.error('Error updating admin user:', updateError);
      throw updateError;
    }

    console.log('Admin password reset successfully:', updateData.user?.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin password reset successfully',
        email: adminEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Error resetting admin password:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to reset admin password'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})