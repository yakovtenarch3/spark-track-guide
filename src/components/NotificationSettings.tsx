import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  Target, 
  Flame, 
  Trophy,
  Send,
  Trash2,
  Save,
  Settings2,
  Loader2
} from 'lucide-react';
import { useNotificationPreferences, NotificationPreferences } from '@/hooks/useNotificationPreferences';

export const NotificationSettings = () => {
  const { preferences, isLoading, savePreferences, deletePreferences, sendTestNotification } = useNotificationPreferences();
  
  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({
    email: '',
    phone: '',
    whatsapp_number: '',
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    reminder_frequency: 3,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    notify_on_missed_login: true,
    notify_on_streak_break: true,
    notify_on_low_engagement: true,
    notify_on_milestones: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      setFormData({
        email: preferences.email || '',
        phone: preferences.phone || '',
        whatsapp_number: preferences.whatsapp_number || '',
        email_enabled: preferences.email_enabled,
        sms_enabled: preferences.sms_enabled,
        whatsapp_enabled: preferences.whatsapp_enabled,
        reminder_frequency: preferences.reminder_frequency,
        quiet_hours_start: preferences.quiet_hours_start || '22:00',
        quiet_hours_end: preferences.quiet_hours_end || '07:00',
        notify_on_missed_login: preferences.notify_on_missed_login,
        notify_on_streak_break: preferences.notify_on_streak_break,
        notify_on_low_engagement: preferences.notify_on_low_engagement,
        notify_on_milestones: preferences.notify_on_milestones,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    await savePreferences(formData);
    setIsSaving(false);
  };

  const handleTestNotification = async (channel: 'email' | 'sms' | 'whatsapp') => {
    setTestingChannel(channel);
    await sendTestNotification(channel);
    setTestingChannel(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">מערכת התראות חכמה</CardTitle>
              <CardDescription>
                הגדר התראות אוטומטיות למייל, SMS ו-WhatsApp
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            פרטי התקשרות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                כתובת מייל
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                מספר טלפון (SMS)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+972501234567"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                מספר WhatsApp
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+972501234567"
                value={formData.whatsapp_number || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ערוצי התראות</CardTitle>
          <CardDescription>בחר דרך אילו ערוצים תרצה לקבל התראות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">מייל</p>
                <p className="text-sm text-muted-foreground">קבל התראות לכתובת המייל</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.email_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, email_enabled: checked })}
              />
              {formData.email_enabled && formData.email && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTestNotification('email')}
                  disabled={testingChannel === 'email'}
                >
                  {testingChannel === 'email' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">SMS</p>
                <p className="text-sm text-muted-foreground">קבל הודעות טקסט</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.sms_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, sms_enabled: checked })}
              />
              {formData.sms_enabled && formData.phone && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTestNotification('sms')}
                  disabled={testingChannel === 'sms'}
                >
                  {testingChannel === 'sms' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">קבל הודעות בוואטסאפ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.whatsapp_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_enabled: checked })}
              />
              {formData.whatsapp_enabled && formData.whatsapp_number && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTestNotification('whatsapp')}
                  disabled={testingChannel === 'whatsapp'}
                >
                  {testingChannel === 'whatsapp' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            תדירות תזכורות
          </CardTitle>
          <CardDescription>כמה פעמים ביום לשלוח תזכורות אם לא נכנסת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">פעם אחת</span>
              <Badge variant="secondary" className="text-lg px-4">
                {formData.reminder_frequency} פעמים
              </Badge>
              <span className="text-sm text-muted-foreground">5 פעמים</span>
            </div>
            <Slider
              value={[formData.reminder_frequency || 3]}
              onValueChange={(value) => setFormData({ ...formData, reminder_frequency: value[0] })}
              min={1}
              max={5}
              step={1}
              className="py-4"
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">התחלת שעות שקט</Label>
              <Input
                id="quiet-start"
                type="time"
                value={formData.quiet_hours_start || '22:00'}
                onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">סיום שעות שקט</Label>
              <Input
                id="quiet-end"
                type="time"
                value={formData.quiet_hours_end || '07:00'}
                onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value })}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            לא יישלחו התראות בין השעות שהגדרת
          </p>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">סוגי התראות</CardTitle>
          <CardDescription>בחר על מה לקבל התראות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">לא נכנסתי לאתר</p>
                <p className="text-sm text-muted-foreground">תזכורת כשלא נכנסת לאפליקציה</p>
              </div>
            </div>
            <Switch
              checked={formData.notify_on_missed_login}
              onCheckedChange={(checked) => setFormData({ ...formData, notify_on_missed_login: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium">שבירת סטריק</p>
                <p className="text-sm text-muted-foreground">התראה כשהסטריק שלך בסכנה</p>
              </div>
            </div>
            <Switch
              checked={formData.notify_on_streak_break}
              onCheckedChange={(checked) => setFormData({ ...formData, notify_on_streak_break: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">מעורבות נמוכה</p>
                <p className="text-sm text-muted-foreground">תזכורת כשלא השלמת מטרות יומיות</p>
              </div>
            </div>
            <Switch
              checked={formData.notify_on_low_engagement}
              onCheckedChange={(checked) => setFormData({ ...formData, notify_on_low_engagement: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">אבני דרך</p>
                <p className="text-sm text-muted-foreground">התראה כשאתה קרוב להישג</p>
              </div>
            </div>
            <Switch
              checked={formData.notify_on_milestones}
              onCheckedChange={(checked) => setFormData({ ...formData, notify_on_milestones: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {preferences && (
          <Button variant="destructive" onClick={deletePreferences}>
            <Trash2 className="h-4 w-4 ml-2" />
            מחק הגדרות
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          שמור הגדרות
        </Button>
      </div>
    </div>
  );
};
