import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  channel: 'email' | 'sms' | 'whatsapp';
  title: string;
  message: string;
  recipientEmail?: string;
  recipientPhone?: string;
  notificationType?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { channel, title, message, recipientEmail, recipientPhone, notificationType } = payload;

    console.log('Received notification request:', { channel, title, notificationType });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let sent = false;
    let errorMessage = '';

    // Send Email via Resend
    if (channel === 'email' && recipientEmail) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (!resendApiKey) {
        throw new Error('RESEND_API_KEY not configured');
      }

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Spark Track <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: title,
            html: `
              <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">🔔 ${title}</h1>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; line-height: 1.6; color: #333;">${message}</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                  <p style="font-size: 14px; color: #666;">
                    📊 Spark Track - האפליקציה שלך לעקוב אחרי הרגלים ומטרות
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('Email sent successfully:', emailResult);
          sent = true;
        } else {
          const emailError = await emailResponse.text();
          console.error('Email sending error:', emailError);
          errorMessage = emailError;
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      }
    }

    // Send SMS via Twilio (if configured)
    if (channel === 'sms' && recipientPhone) {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (twilioSid && twilioToken && twilioPhone) {
        try {
          const smsResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                From: twilioPhone,
                To: recipientPhone,
                Body: `${title}\n\n${message}`,
              }),
            }
          );
          
          if (smsResponse.ok) {
            console.log('SMS sent successfully');
            sent = true;
          } else {
            const smsError = await smsResponse.text();
            console.error('SMS error:', smsError);
            errorMessage = smsError;
          }
        } catch (smsErr) {
          console.error('SMS sending error:', smsErr);
          errorMessage = smsErr instanceof Error ? smsErr.message : String(smsErr);
        }
      } else {
        console.log('Twilio not configured for SMS');
        errorMessage = 'Twilio SMS not configured';
      }
    }

    // Send WhatsApp via Twilio (if configured)
    if (channel === 'whatsapp' && recipientPhone) {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioWhatsapp = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

      if (twilioSid && twilioToken && twilioWhatsapp) {
        try {
          const waResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                From: `whatsapp:${twilioWhatsapp}`,
                To: `whatsapp:${recipientPhone}`,
                Body: `🔔 ${title}\n\n${message}`,
              }),
            }
          );
          
          if (waResponse.ok) {
            console.log('WhatsApp sent successfully');
            sent = true;
          } else {
            const waError = await waResponse.text();
            console.error('WhatsApp error:', waError);
            errorMessage = waError;
          }
        } catch (waErr) {
          console.error('WhatsApp sending error:', waErr);
          errorMessage = waErr instanceof Error ? waErr.message : String(waErr);
        }
      } else {
        console.log('Twilio not configured for WhatsApp');
        errorMessage = 'Twilio WhatsApp not configured';
      }
    }

    // Log the notification
    await supabaseClient.from('notification_logs').insert({
      channel,
      notification_type: notificationType || 'general',
      message: `${title}: ${message}`,
      status: sent ? 'sent' : 'failed',
      error_message: errorMessage || null,
    });

    return new Response(
      JSON.stringify({ 
        success: sent, 
        message: sent ? 'Notification sent successfully' : 'Failed to send notification',
        error: errorMessage || undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: sent ? 200 : 400,
      }
    );
  } catch (error) {
    console.error('Notification function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
