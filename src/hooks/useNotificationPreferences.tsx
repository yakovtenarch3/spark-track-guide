import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id: string;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  reminder_frequency: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  notify_on_missed_login: boolean;
  notify_on_streak_break: boolean;
  notify_on_low_engagement: boolean;
  notify_on_milestones: boolean;
  custom_triggers: any[];
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPreferences({
          ...data,
          custom_triggers: Array.isArray(data.custom_triggers) ? data.custom_triggers : []
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      if (preferences?.id) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(newPreferences)
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert([newPreferences])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPreferences({
            ...data,
            custom_triggers: Array.isArray(data.custom_triggers) ? data.custom_triggers : []
          });
        }
      }

      await fetchPreferences();
      toast.success('הגדרות ההתראות נשמרו בהצלחה');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('שגיאה בשמירת ההגדרות');
    }
  };

  const deletePreferences = async () => {
    if (!preferences?.id) return;
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .delete()
        .eq('id', preferences.id);

      if (error) throw error;
      
      setPreferences(null);
      toast.success('הגדרות ההתראות נמחקו');
    } catch (error) {
      console.error('Error deleting notification preferences:', error);
      toast.error('שגיאה במחיקת ההגדרות');
    }
  };

  const sendTestNotification = async (channel: 'email' | 'sms' | 'whatsapp') => {
    if (!preferences) {
      toast.error('יש להגדיר קודם את פרטי ההתראות');
      return;
    }

    try {
      const response = await supabase.functions.invoke('send-notification', {
        body: {
          channel,
          title: 'בדיקת התראות - Spark Track',
          message: 'זוהי הודעת בדיקה ממערכת ההתראות החכמה שלך! 🎉',
          recipientEmail: preferences.email,
          recipientPhone: channel === 'sms' ? preferences.phone : preferences.whatsapp_number,
          notificationType: 'test',
        },
      });

      if (response.error) throw response.error;
      
      if (response.data?.success) {
        toast.success(`התראת ${channel} נשלחה בהצלחה!`);
      } else {
        toast.error(response.data?.error || 'שגיאה בשליחת ההתראה');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('שגיאה בשליחת התראת הבדיקה');
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    isLoading,
    savePreferences,
    deletePreferences,
    sendTestNotification,
    refetch: fetchPreferences,
  };
};
