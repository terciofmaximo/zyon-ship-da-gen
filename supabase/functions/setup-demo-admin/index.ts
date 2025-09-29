import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoAdminConfig {
  email: string
  password: string
  enabled: boolean
  skipEmailVerification: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Setting up demo admin account...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Demo admin configuration
    const config: DemoAdminConfig = {
      email: 'admin@zyon.com',
      password: 'Admin123!',
      enabled: true,
      skipEmailVerification: true
    }

    if (!config.enabled) {
      return new Response(
        JSON.stringify({ message: 'Demo admin is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists by trying to list users
    const { data: listResponse, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    let existingUser = null
    if (!listError && listResponse?.users) {
      existingUser = listResponse.users.find(user => user.email === config.email)
    }
    
    let userId: string

    if (existingUser) {
      console.log('Demo admin user already exists, updating...')
      userId = existingUser.id

      // Update user to ensure email is verified
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: { 
          name: 'Demo Admin',
          full_name: 'Demo Admin' 
        }
      })

      if (updateError) {
        console.error('Error updating demo admin user:', updateError)
        throw updateError
      }
    } else {
      console.log('Creating new demo admin user...')
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: config.email,
        password: config.password,
        email_confirm: config.skipEmailVerification,
        user_metadata: { 
          name: 'Demo Admin',
          full_name: 'Demo Admin' 
        }
      })

      if (createError) {
        console.error('Error creating demo admin user:', createError)
        throw createError
      }

      if (!newUser.user) {
        throw new Error('Failed to create demo admin user')
      }

      userId = newUser.user.id
    }

    // Setup demo admin role using the database function
    const { data: setupResult, error: setupError } = await supabaseAdmin.rpc('setup_demo_admin', {
      admin_email: config.email,
      admin_password: config.password
    })

    if (setupError) {
      console.error('Error setting up demo admin role:', setupError)
      throw setupError
    }

    console.log('Demo admin setup result:', setupResult)

    // Create audit log entry
    console.log(`Demo admin setup completed for ${config.email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo admin account configured successfully',
        userId: userId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in setup-demo-admin function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})