import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting platform admin seed...');

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adminEmail = 'contact@vesselopsportal.com';
    const adminPassword = 'Admin123!';

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      console.log('User already exists, updating...');
      userId = existingUser.id;

      // Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            name: 'Platform Admin',
          },
        }
      );

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }

      console.log('User updated successfully');
    } else {
      console.log('Creating new user...');

      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Platform Admin',
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('User creation returned no user data');
      }

      userId = newUser.user.id;
      console.log('User created successfully with ID:', userId);
    }

    // Grant platformAdmin role
    console.log('Granting platformAdmin role...');
    
    // First, remove any existing roles for this user to avoid duplicates
    const { error: deleteRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteRolesError) {
      console.error('Error removing existing roles:', deleteRolesError);
      // Continue anyway, might not be a critical error
    }

    // Insert platformAdmin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'platformAdmin',
      });

    if (roleError) {
      console.error('Error inserting role:', roleError);
      throw roleError;
    }

    console.log('platformAdmin role granted successfully');

    // Optional: Add to Zyon organization as owner for demo purposes
    console.log('Checking for Zyon organization...');
    
    const { data: zyonOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .ilike('name', '%zyon%')
      .limit(1)
      .maybeSingle();

    if (!orgError && zyonOrg) {
      console.log('Found Zyon organization, adding user as owner...');
      
      // Check if already a member
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('*')
        .eq('org_id', zyonOrg.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMember) {
        const { error: memberError } = await supabaseAdmin
          .from('organization_members')
          .insert({
            org_id: zyonOrg.id,
            user_id: userId,
            role: 'owner',
          });

        if (memberError) {
          console.error('Error adding to organization:', memberError);
          // Non-critical, continue
        } else {
          console.log('Added to Zyon organization as owner');
        }
      } else {
        console.log('Already a member of Zyon organization');
      }
    } else {
      console.log('Zyon organization not found, skipping org membership');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Platform admin seeded successfully',
        email: adminEmail,
        userId: userId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in seed-platform-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
