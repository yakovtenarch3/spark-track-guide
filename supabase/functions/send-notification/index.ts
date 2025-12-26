import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId: string;
  type: 'email' | 'whatsapp';
  title: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const payload: NotificationPayload = await req.json()
    const { userId, type, title, message } = payload

    // Get user preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefError || !preferences) {
      throw new Error('No notification preferences found')
    }

    let sent = false

    // Send email
    if (type === 'email' && preferences.email_enabled && preferences.email_address) {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // Example with Resend API:
      /*
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Spark Track <noreply@sparktrack.com>',
          to: preferences.email_address,
          subject: title,
          html: `<p>${message}</p>`,
        }),
      })
      sent = emailResponse.ok
      */
      
      console.log('Email would be sent to:', preferences.email_address)
      console.log('Title:', title)
      console.log('Message:', message)
      sent = true // Simulate success
    }

    // Send WhatsApp
    if (type === 'whatsapp' && preferences.whatsapp_enabled && preferences.whatsapp_number) {
      // TODO: Integrate with WhatsApp Business API or Twilio
      // Example with Twilio:
      /*
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const twilioWhatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')
      
      const whatsappResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${twilioWhatsappNumber}`,
            To: `whatsapp:${preferences.whatsapp_number}`,
            Body: `${title}\n\n${message}`,
          }),
        }
      )
      sent = whatsappResponse.ok
      */
      
      console.log('WhatsApp would be sent to:', preferences.whatsapp_number)
      console.log('Title:', title)
      console.log('Message:', message)
      sent = true // Simulate success
    }

    return new Response(
      JSON.stringify({ success: sent, message: 'Notification processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
