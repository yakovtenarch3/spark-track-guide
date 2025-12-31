import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationCheck {
  type: string;
  shouldNotify: boolean;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting smart notifications check...');

    // Get notification preferences
    const { data: preferences } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .limit(1)
      .single();

    if (!preferences) {
      console.log('No notification preferences found');
      return new Response(
        JSON.stringify({ message: 'No notification preferences configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check quiet hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const quietStart = preferences.quiet_hours_start?.slice(0, 5) || '22:00';
    const quietEnd = preferences.quiet_hours_end?.slice(0, 5) || '07:00';

    const isQuietHours = (current: string, start: string, end: string) => {
      if (start <= end) {
        return current >= start && current <= end;
      }
      return current >= start || current <= end;
    };

    if (isQuietHours(currentTime, quietStart, quietEnd)) {
      console.log('Currently in quiet hours, skipping notifications');
      return new Response(
        JSON.stringify({ message: 'Quiet hours active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications: NotificationCheck[] = [];

    // Check habit streak breaks
    if (preferences.notify_on_streak_break) {
      const { data: habits } = await supabaseClient
        .from('habits')
        .select('*, habit_completions(*)')
        .eq('is_archived', false);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      habits?.forEach(habit => {
        const hadCompletionYesterday = habit.habit_completions?.some(
          (c: { completed_at: string }) => c.completed_at.startsWith(yesterdayStr)
        );
        
        if (!hadCompletionYesterday && habit.streak > 0) {
          notifications.push({
            type: 'streak_break',
            shouldNotify: true,
            message: `⚠️ הרגל "${habit.title}" - הסטריק שלך בסכנה! אל תשבור את הרצף של ${habit.streak} ימים!`,
            priority: 'high',
          });
        }
      });
    }

    // Check daily goals completion
    if (preferences.notify_on_low_engagement) {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: goals } = await supabaseClient
        .from('daily_goals')
        .select('*, daily_goal_logs(*)')
        .eq('is_active', true);

      const { data: todayLogs } = await supabaseClient
        .from('daily_goal_logs')
        .select('*')
        .eq('log_date', today);

      const completedToday = todayLogs?.length || 0;
      const totalGoals = goals?.length || 0;

      if (totalGoals > 0 && completedToday < totalGoals / 2) {
        const remaining = totalGoals - completedToday;
        notifications.push({
          type: 'low_engagement',
          shouldNotify: true,
          message: `📊 נשארו לך עוד ${remaining} מטרות יומיות להיום! אל תשכח לסמן אותן ✅`,
          priority: 'medium',
        });
      }
    }

    // Check milestones
    if (preferences.notify_on_milestones) {
      const { data: profile } = await supabaseClient
        .from('user_profile')
        .select('*')
        .limit(1)
        .single();

      const milestones = [100, 250, 500, 1000, 2500, 5000];
      const currentPoints = profile?.total_points || 0;

      for (const milestone of milestones) {
        if (currentPoints >= milestone - 10 && currentPoints < milestone) {
          notifications.push({
            type: 'milestone',
            shouldNotify: true,
            message: `🏆 אתה ממש קרוב! עוד ${milestone - currentPoints} נקודות ותגיע ל-${milestone} נקודות!`,
            priority: 'low',
          });
          break;
        }
      }
    }

    console.log(`Found ${notifications.length} notifications to send`);

    // Send notifications through all enabled channels
    const channels = [];
    if (preferences.email_enabled && preferences.email) channels.push('email');
    if (preferences.sms_enabled && preferences.phone) channels.push('sms');
    if (preferences.whatsapp_enabled && preferences.whatsapp_number) channels.push('whatsapp');

    const results = [];

    for (const notification of notifications) {
      for (const channel of channels) {
        try {
          const response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                channel,
                title: 'Spark Track - תזכורת חכמה',
                message: notification.message,
                recipientEmail: preferences.email,
                recipientPhone: channel === 'sms' ? preferences.phone : preferences.whatsapp_number,
                notificationType: notification.type,
              }),
            }
          );

          const result = await response.json();
          results.push({ channel, notification: notification.type, ...result });
        } catch (err) {
          console.error(`Error sending ${channel} notification:`, err);
          results.push({ channel, notification: notification.type, error: String(err) });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsChecked: notifications.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Smart notifications error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
