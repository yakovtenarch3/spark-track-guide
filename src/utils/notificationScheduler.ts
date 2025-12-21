import { getRandomQuote } from "@/data/motivationalQuotes";

// Notification scheduler that runs in the app
export const initNotificationScheduler = () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }

  // Check reminders every minute
  setInterval(() => {
    checkAndShowReminders();
  }, 60000);

  // Check immediately on load
  setTimeout(checkAndShowReminders, 1000);
};

const checkAndShowReminders = () => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const reminders = JSON.parse(localStorage.getItem('habitReminders') || '[]');

  reminders.forEach((reminder: any) => {
    if (reminder.hours === currentHours && reminder.minutes === currentMinutes) {
      // Get motivational quote
      const quote = getRandomQuote();
      const motivationalBody = `${reminder.body}\n\n💪 ${quote.text}\n- ${quote.author}`;
      
      // Show notification
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: `⏰ תזכורת: ${reminder.title}`,
            body: motivationalBody,
            icon: '/favicon.ico',
          });
        } else {
          // Fallback to regular notification
          new Notification(`⏰ תזכורת: ${reminder.title}`, {
            body: motivationalBody,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      }
    }
  });
};
