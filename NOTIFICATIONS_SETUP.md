# 📧 מערכת התראות אוטומטיות

## סקירה

מערכת התראות מבוססת Supabase Edge Functions ש שולחת Email/WhatsApp אוטומטית למשתמשים.

## Edge Functions

### 1. `send-notification`
שולח התראה בודדת (Email או WhatsApp).

**נתיב**: `/functions/v1/send-notification`

**Payload**:
```json
{
  "userId": "uuid",
  "type": "email" | "whatsapp",
  "title": "כותרת ההתראה",
  "message": "תוכן ההתראה"
}
```

### 2. `check-accountability`
בודק יומית את מעורבות המשתמשים ויוצר התראות.

**מתי רץ**: Cron job יומי ב-20:00

**בדיקות**:
- ✅ האם המשתמש נכנס אתמול
- ✅ האם המעורבות נמוכה (מתחת ל-30%)
- ✅ האם רצף נשבר
- ✅ אבני דרך (7, 14, 30, 60, 90, 180, 365 ימים)

## התקנה

### 1. Deploy Edge Functions

```bash
# התקנת Supabase CLI
npm install -g supabase

# Login
supabase login

# Link לפרויקט
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy send-notification
supabase functions deploy check-accountability
```

### 2. הגדרת Secrets

```bash
# Email (Resend)
supabase secrets set RESEND_API_KEY=your_resend_api_key

# WhatsApp (Twilio)
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
supabase secrets set TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 3. הגדרת Cron Job

ב-Supabase Dashboard → Database → Cron Jobs:

```sql
SELECT cron.schedule(
  'check-accountability-daily',
  '0 20 * * *', -- כל יום ב-20:00
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-accountability',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

## אינטגרציות

### Email - Resend

1. הירשם ל-[Resend](https://resend.com)
2. קבל API Key
3. הוסף ל-Secrets
4. עדכן את הקוד ב-`send-notification/index.ts`

```typescript
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
```

### WhatsApp - Twilio

1. הירשם ל-[Twilio](https://www.twilio.com)
2. הפעל WhatsApp Business API
3. קבל credentials
4. הוסף ל-Secrets
5. עדכן את הקוד:

```typescript
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
```

## העדפות משתמש

משתמשים יכולים להגדיר העדפות התראות בטבלה `notification_preferences`:

```typescript
interface NotificationPreferences {
  email_enabled: boolean;
  email_address: string;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  
  // Alert types
  alert_missed_login: boolean;
  alert_low_engagement: boolean;
  alert_streak_break: boolean;
  alert_milestones: boolean;
  
  // Timing
  check_time: string; // "20:00:00"
  quiet_hours_start: string; // "22:00:00"
  quiet_hours_end: string; // "08:00:00"
}
```

## בדיקה ידנית

### שליחת התראה בודדת

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID",
    "type": "email",
    "title": "Test Alert",
    "message": "This is a test message"
  }'
```

### הרצת בדיקה יומית

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-accountability \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## טיפים

### 1. בדיקת לוגים

```bash
supabase functions logs send-notification
supabase functions logs check-accountability
```

### 2. פיתוח מקומי

```bash
# Run locally
supabase functions serve send-notification --env-file ./supabase/.env.local
supabase functions serve check-accountability --env-file ./supabase/.env.local
```

### 3. שעות שקט

המערכת לא תשלח התראות בשעות השקט שהוגדרו על ידי המשתמש.

### 4. Rate Limiting

מומלץ להגביל את מספר ההתראות ליום:
- לא יותר מ-3 התראות ביום
- לא יותר מהתראה אחת בשעה

## עלויות

### Resend
- 3,000 emails/חודש - חינם
- $10/חודש - 50,000 emails

### Twilio WhatsApp
- $0.005 לכל הודעה
- דרישה: WhatsApp Business Account

## אבטחה

- ✅ כל ה-secrets מוגנים ב-Supabase
- ✅ RLS policies על כל הטבלאות
- ✅ CORS מוגדר נכון
- ✅ Authentication נדרש לכל הפונקציות

## תמיכה

לבעיות או שאלות:
1. בדוק את הלוגים
2. ודא שה-secrets מוגדרים נכון
3. בדוק את ה-Cron job status
4. ודא שהמשתמשים הגדירו העדפות התראות

---

**נוצר על ידי**: Spark Track Team  
**עודכן**: דצמבר 2024
