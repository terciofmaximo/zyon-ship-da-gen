import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  companyName: string;
  inviteLink: string;
  tenantSlug: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName, inviteLink, tenantSlug }: InvitationEmailRequest = await req.json();

    console.log('Sending invitation email to:', email);
    console.log('Company:', companyName);
    console.log('Tenant slug:', tenantSlug);

    const subject = `Welcome to Vessel Ops Portal — your access to ${companyName}`;

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #0088cc;
              }
              .content {
                padding: 30px 0;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #0088cc;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px 0;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
              }
              .tenant-info {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Vessel Ops Portal</h1>
            </div>
            
            <div class="content">
              <h2>Welcome to ${companyName}!</h2>
              
              <p>You've been invited to access Vessel Ops Portal for <strong>${companyName}</strong>.</p>
              
              <div class="tenant-info">
                <p><strong>Your organization portal:</strong><br>
                https://${tenantSlug}.vesselopsportal.com</p>
              </div>
              
              <p>Click the button below to set your password and activate your account:</p>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Set My Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                ${inviteLink}
              </p>
              
              <p style="color: #e53e3e; font-weight: bold;">⏰ This link expires in 72 hours.</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't expect this invitation, please ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Vessel Ops Portal. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    const text = `
Welcome to Vessel Ops Portal!

You've been invited to access Vessel Ops Portal for ${companyName}.

Tenant: ${tenantSlug}.vesselopsportal.com

Click the link below to set your password and activate your account:
${inviteLink}

This link expires in 72 hours.

If you didn't expect this invitation, please ignore this email.

— Vessel Ops Portal
      `;

    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vessel Ops Portal <onboarding@resend.dev>',
        to: [email],
        subject,
        html,
        text,
      }),
    });

    const emailResponse = await res.json();
    if (!res.ok) {
      console.error('Resend API error:', emailResponse);
      throw new Error(emailResponse?.message || 'Failed to send email via Resend');
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
