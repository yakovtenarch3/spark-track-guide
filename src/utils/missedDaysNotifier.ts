import { getQuoteByCategory, MotivationalQuote } from "@/data/motivationalQuotes";

// Get a motivational message for missed days
export const getMissedDayMessage = (missedCount: number): { title: string; body: string; quote: MotivationalQuote } => {
  const quote = getQuoteByCategory("persistence");
  
  let title = "";
  let body = "";
  
  if (missedCount === 1) {
    title = "פספסת יום אחד";
    body = "אתמול לא סימנת פעילות. היום זה יום חדש להתחיל מחדש! 💪";
  } else if (missedCount <= 3) {
    title = `פספסת ${missedCount} ימים`;
    body = "עדיין לא מאוחר לחזור למסלול. תתחיל היום עם צעד קטן!";
  } else if (missedCount <= 7) {
    title = `שבוע קשה - ${missedCount} ימים ללא פעילות`;
    body = "אנחנו כולנו נופלים לפעמים. החזרה למסלול מתחילה עכשיו!";
  } else {
    title = `הגיע הזמן לחזור - ${missedCount} ימים`;
    body = "כל יום הוא הזדמנות חדשה. מחכים לך פה! 🌟";
  }
  
  return { title, body, quote };
};

// Store last notification date to avoid spam
const LAST_MISSED_NOTIFICATION_KEY = "lastMissedDayNotification";

export const shouldShowMissedNotification = (): boolean => {
  const lastNotification = localStorage.getItem(LAST_MISSED_NOTIFICATION_KEY);
  if (!lastNotification) return true;
  
  const lastDate = new Date(lastNotification);
  const now = new Date();
  
  // Only show once per day
  return lastDate.toDateString() !== now.toDateString();
};

export const markMissedNotificationShown = () => {
  localStorage.setItem(LAST_MISSED_NOTIFICATION_KEY, new Date().toISOString());
};

// Check for missed days and show notification
export const checkAndNotifyMissedDays = async (metrics: Array<{ date: string; logged_in: boolean }>) => {
  if (!shouldShowMissedNotification()) return;
  
  // Find consecutive missed days from today backwards
  let missedCount = 0;
  const today = new Date();
  
  for (let i = 0; i < metrics.length; i++) {
    const metric = metrics[i];
    if (!metric.logged_in) {
      missedCount++;
    } else {
      break;
    }
  }
  
  // If yesterday was logged, don't notify
  if (missedCount === 0) return;
  
  // Don't count today if it's early
  const currentHour = today.getHours();
  if (currentHour < 12 && missedCount === 1) {
    // Before noon and only today is "missed" - skip notification
    return;
  }
  
  // Show notification
  if (Notification.permission === "granted" && missedCount > 0) {
    const { title, body, quote } = getMissedDayMessage(missedCount);
    const fullBody = `${body}\n\n💡 "${quote.text}"\n- ${quote.author}`;
    
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: `⚠️ ${title}`,
        body: fullBody,
        icon: "/favicon.ico",
      });
    } else {
      new Notification(`⚠️ ${title}`, {
        body: fullBody,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
    
    markMissedNotificationShown();
  }
};
