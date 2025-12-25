import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Get all users with notification preferences
    const { data: usersPrefs, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .or('email_enabled.eq.true,whatsapp_enabled.eq.true')

    if (prefsError) throw prefsError

    const alerts = []

    for (const prefs of usersPrefs || []) {
      // Check if user logged in yesterday
      const { data: yesterdayMetrics } = await supabaseClient
        .from('engagement_metrics')
        .select('*')
        .eq('user_id', prefs.user_id)
        .eq('date', yesterday)
        .single()

      // Check if user logged in today
      const { data: todayMetrics } = await supabaseClient
        .from('engagement_metrics')
        .select('*')
        .eq('user_id', prefs.user_id)
        .eq('date', today)
        .single()

      // Alert if didn't log in yesterday
      if (!yesterdayMetrics || !yesterdayMetrics.logged_in) {
        if (prefs.alert_missed_login) {
          await createAlert(supabaseClient, {
            user_id: prefs.user_id,
            alert_type: 'missed_login',
            severity: 'medium',
            title: '⚠️ לא נכנסת אתמול',
            message: 'היי! שמנו לב שלא נכנסת אתמול לאתר. אל תשבור את הרצף שלך! 🔥',
            should_send_email: prefs.email_enabled,
            should_send_whatsapp: prefs.whatsapp_enabled,
          })
          alerts.push(`Alert created for user ${prefs.user_id} - missed login`)
        }
      }

      // Alert if low engagement yesterday
      if (yesterdayMetrics && yesterdayMetrics.engagement_score < 30) {
        if (prefs.alert_low_engagement) {
          await createAlert(supabaseClient, {
            user_id: prefs.user_id,
            alert_type: 'low_engagement',
            severity: 'low',
            title: '📉 מעורבות נמוכה אתמול',
            message: `ציון המעורבות שלך אתמול היה ${yesterdayMetrics.engagement_score}%. בואו נשפר את זה היום! 💪`,
            should_send_email: prefs.email_enabled,
            should_send_whatsapp: prefs.whatsapp_enabled,
          })
          alerts.push(`Alert created for user ${prefs.user_id} - low engagement`)
        }
      }

      // Check for streak break
      const { data: recentMetrics } = await supabaseClient
        .from('engagement_metrics')
        .select('*')
        .eq('user_id', prefs.user_id)
        .order('date', { ascending: false })
        .limit(2)

      if (recentMetrics && recentMetrics.length >= 2) {
        const current = recentMetrics[0]
        const previous = recentMetrics[1]
        
        if (previous.current_streak > 3 && current.current_streak === 0) {
          if (prefs.alert_streak_break) {
            await createAlert(supabaseClient, {
              user_id: prefs.user_id,
              alert_type: 'streak_break',
              severity: 'high',
              title: '💔 הרצף נשבר',
              message: `הרצף של ${previous.current_streak} ימים נשבר. זה הזמן להתחיל מחדש!`,
              should_send_email: prefs.email_enabled,
              should_send_whatsapp: prefs.whatsapp_enabled,
            })
            alerts.push(`Alert created for user ${prefs.user_id} - streak break`)
          }
        }
      }

      // Celebrate milestones
      if (todayMetrics && todayMetrics.current_streak > 0) {
        const streak = todayMetrics.current_streak
        if ([7, 14, 30, 60, 90, 180, 365].includes(streak)) {
          if (prefs.alert_milestones) {
            await createAlert(supabaseClient, {
              user_id: prefs.user_id,
              alert_type: 'milestone',
              severity: 'low',
              title: `🎉 אבן דרך: ${streak} ימים רצופים!`,
              message: `מדהים! ${streak} ימים רצופים של מעקב. אתה מדהים! 🌟`,
              should_send_email: prefs.email_enabled,
              should_send_whatsapp: prefs.whatsapp_enabled,
            })
            alerts.push(`Milestone alert for user ${prefs.user_id} - ${streak} days`)
          }
        }
      }
    }

    // Send pending alerts
    const { data: pendingAlerts } = await supabaseClient
      .from('accountability_alerts')
      .select('*')
      .eq('email_sent', false)
      .eq('should_send_email', true)
      .limit(50)

    for (const alert of pendingAlerts || []) {
      // Call send-notification function
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: alert.user_id,
          type: 'email',
          title: alert.title,
          message: alert.message,
        }),
      })

      // Mark as sent
      await supabaseClient
        .from('accountability_alerts')
        .update({ email_sent: true })
        .eq('id', alert.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_created: alerts.length,
        alerts_sent: pendingAlerts?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function createAlert(supabase: any, alert: any) {
  await supabase
    .from('accountability_alerts')
    .insert(alert)
}
