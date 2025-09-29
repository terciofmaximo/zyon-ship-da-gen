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
    console.log('=== Starting platform admin seed ===');

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

    console.log(`Checking for existing user: ${adminEmail}`);

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

    let userId: string;

    if (existingUser) {
      console.log(`User exists with ID: ${existingUser.id}`);
      console.log(`Current email_confirmed_at: ${existingUser.email_confirmed_at}`);
      userId = existingUser.id;

      // Update existing user - force email confirmation and update password
      console.log('Updating user with email confirmation...');
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
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
      console.log(`New email_confirmed_at: ${updatedUser.user.email_confirmed_at}`);
    } else {
      console.log('User does not exist, creating new user...');

      // Create new user with email already confirmed
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
      console.log(`User created successfully with ID: ${userId}`);
      console.log(`Email confirmed at: ${newUser.user.email_confirmed_at}`);
    }

    // Grant platformAdmin role using user_roles table
    console.log('Managing platformAdmin role...');
    
    // First, check if role already exists
    const { data: existingRoles, error: checkRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'platformAdmin');

    if (checkRoleError) {
      console.error('Error checking existing roles:', checkRoleError);
    }

    if (!existingRoles || existingRoles.length === 0) {
      console.log('platformAdmin role not found, inserting...');
      
      // Remove any other roles first to ensure clean state
      const { error: deleteRolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteRolesError) {
        console.error('Error removing existing roles:', deleteRolesError);
        // Continue anyway
      }

      // Insert platformAdmin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'platformAdmin',
        });

      if (roleError) {
        console.error('Error inserting platformAdmin role:', roleError);
        throw roleError;
      }

      console.log('platformAdmin role granted successfully');
    } else {
      console.log('platformAdmin role already exists');
    }

    // Verify role was set correctly
    const { data: verifyRoles, error: verifyError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    console.log('Current user roles:', JSON.stringify(verifyRoles));

    // Add to Zyon organization as owner for demo purposes
    console.log('Checking for Zyon organization...');
    
    const { data: zyonOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .ilike('name', '%zyon%')
      .limit(1)
      .maybeSingle();

    if (!orgError && zyonOrg) {
      console.log(`Found organization: ${zyonOrg.name} (${zyonOrg.id})`);
      
      // Check if already a member
      const { data: existingMember, error: memberCheckError } = await supabaseAdmin
        .from('organization_members')
        .select('*')
        .eq('org_id', zyonOrg.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (memberCheckError) {
        console.error('Error checking membership:', memberCheckError);
      }

      if (!existingMember) {
        console.log('Adding user to organization as owner...');
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
          console.log('Successfully added to organization');
        }
      } else {
        console.log(`Already a member with role: ${existingMember.role}`);
        
        // Update role to owner if not already
        if (existingMember.role !== 'owner') {
          console.log('Updating role to owner...');
          const { error: updateMemberError } = await supabaseAdmin
            .from('organization_members')
            .update({ role: 'owner' })
            .eq('org_id', zyonOrg.id)
            .eq('user_id', userId);

          if (updateMemberError) {
            console.error('Error updating member role:', updateMemberError);
          } else {
            console.log('Role updated to owner');
          }
        }
      }
    } else {
      console.log('Zyon organization not found');
    }

    console.log('=== Platform admin seed completed successfully ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Platform admin seeded successfully',
        email: adminEmail,
        userId: userId,
        details: {
          userExists: !!existingUser,
          roleSet: true,
          organizationMember: !!zyonOrg,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('=== Error in seed-platform-admin ===');
    console.error('Error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
