import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  role: string;
  primary_domain?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, org_id, org_name, org_slug, role, primary_domain }: InviteRequest = await req.json();

    console.log('Processing invite for:', { email, org_id, org_name, role });

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error('Error checking users:', userCheckError);
      throw userCheckError;
    }

    const userExists = existingUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // Determine redirect URL based on environment
    const hostname = new URL(supabaseUrl).hostname;
    const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('supabase.co');
    
    let redirectTo: string;
    if (isDev || !primary_domain) {
      // Development or no custom domain: use path-based routing
      redirectTo = `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/t/${org_slug}`;
    } else {
      // Production with custom domain
      redirectTo = `https://${primary_domain}`;
    }

    if (userExists) {
      console.log('User already exists, adding to organization');
      
      // Add user to organization
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          org_id,
          user_id: userExists.id,
          role,
        });

      if (memberError && memberError.code !== '23505') { // Ignore duplicate key error
        console.error('Error adding member:', memberError);
        throw memberError;
      }

      // Update user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          user_id: userExists.id,
          tenant_id: org_id,
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Send password reset email as notification
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo,
        },
      });

      if (resetError) {
        console.error('Error sending magic link:', resetError);
        throw resetError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Existing user added to organization and notified',
          user_id: userExists.id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } else {
      console.log('Creating new user invite');
      
      // Invite new user
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          org_id,
          org_name,
          role,
        },
      });

      if (inviteError) {
        console.error('Error inviting user:', inviteError);
        throw inviteError;
      }

      console.log('User invited successfully:', inviteData.user.id);

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: inviteData.user.id,
          tenant_id: org_id,
          invited_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Add to organization (will be confirmed when they accept)
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          org_id,
          user_id: inviteData.user.id,
          role,
        });

      if (memberError && memberError.code !== '23505') {
        console.error('Error adding member:', memberError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User invited successfully',
          user_id: inviteData.user.id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in send-organization-invite:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
