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

  // Check habit reminders
  const habitReminders = JSON.parse(localStorage.getItem('habitReminders') || '[]');
  // Check goal reminders
  const goalReminders = JSON.parse(localStorage.getItem('goalReminders') || '[]');
  
  const allReminders = [...habitReminders, ...goalReminders];

  allReminders.forEach((reminder: any) => {
    if (reminder.hours === currentHours && reminder.minutes === currentMinutes) {
      // Get motivational quote
      const quote = getRandomQuote();
      const motivationalBody = `${reminder.body}\n\n💪 ${quote.text}\n- ${quote.author}`;
      const icon = reminder.type === 'goal' ? '🎯' : '⏰';
      
      // Show notification
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: `${icon} תזכורת: ${reminder.title}`,
            body: motivationalBody,
            icon: '/favicon.ico',
          });
        } else {
          // Fallback to regular notification
          new Notification(`${icon} תזכורת: ${reminder.title}`, {
            body: motivationalBody,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      }
    }
  });
};
