import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create admin user if it doesn't exist
    const adminEmail = 'admin@zyon.com'
    const adminPassword = 'Admin123!'

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers()
    const adminExists = existingUsers?.users?.some(user => user.email === adminEmail)

    if (!adminExists) {
      console.log('Creating admin user...')
      
      // Create the admin user
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      })

      if (createError) {
        console.error('Error creating admin user:', createError)
        throw createError
      }

      console.log('Admin user created:', newUser.user?.id)

      // Wait a moment for the trigger to create the default role
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update user role to admin (remove default 'user' role and add 'admin')
      if (newUser.user?.id) {
        // Remove default 'user' role
        await supabaseClient
          .from('user_roles')
          .delete()
          .eq('user_id', newUser.user.id)
          .eq('role', 'user')

        // Add 'admin' role
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'admin' as const
          })

        if (roleError) {
          console.error('Error assigning admin role:', roleError)
          throw roleError
        }

        console.log('Admin role assigned successfully')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user created successfully',
          userId: newUser.user?.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log('Admin user already exists')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user already exists'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('Error in setup-admin function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})