import { getRandomQuote } from "@/data/motivationalQuotes";

// Check if we're in production (deployed site)
const isProduction = () => {
  return window.location.hostname.includes('.lovableproject.com') || 
         !window.location.hostname.includes('localhost');
};

// Clear all Service Worker caches
const clearAllCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  }
};

// Unregister all Service Workers
const unregisterAllServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    }
  }
};

// Notification scheduler that runs in the app
export const initNotificationScheduler = () => {
  // Only register SW in production, unregister in dev/preview
  if ('serviceWorker' in navigator) {
    if (isProduction()) {
      // Production: register SW normally
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    } else {
      // Development/Preview: unregister SW and clear caches
      console.log('[SW] Development mode detected - clearing caches and unregistering SW');
      unregisterAllServiceWorkers();
      clearAllCaches();
    }
  }

  // Check reminders every minute
  setInterval(() => {
    checkAndShowReminders();
  }, 60000);

  // Check immediately on load
  setTimeout(checkAndShowReminders, 1000);
};

// Manual cache clear function - can be called from settings
export const clearCacheAndRefresh = async () => {
  await clearAllCaches();
  await unregisterAllServiceWorkers();
  
  // Clear display preferences from localStorage
  localStorage.removeItem('book-reader-frame-size');
  localStorage.removeItem('book-reader-frame-style');
  localStorage.removeItem('book-reader-font');
  localStorage.removeItem('book-reader-zoom');
  
  // Reload the page
  window.location.reload();
};

const checkAndShowReminders = async () => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // Check habit reminders
  const habitReminders = JSON.parse(localStorage.getItem('habitReminders') || '[]');
  // Check goal reminders
  const goalReminders = JSON.parse(localStorage.getItem('goalReminders') || '[]');
  // Check wake-up reminder
  const wakeUpReminder = JSON.parse(localStorage.getItem('wakeUpReminder') || 'null');
  // Check coach reminders
  const coachReminders = JSON.parse(localStorage.getItem('coachReminders') || '[]');
  
  const allReminders = [...habitReminders, ...goalReminders, ...coachReminders];
  
  // Add wake-up reminder if exists
  if (wakeUpReminder) {
    allReminders.push(wakeUpReminder);
  }

  allReminders.forEach((reminder: any) => {
    if (reminder.hours === currentHours && reminder.minutes === currentMinutes) {
      // Get motivational quote
      const quote = getRandomQuote();
      let motivationalBody = `${reminder.body}\n\n💪 ${quote.text}\n- ${quote.author}`;
      let icon = '⏰';
      
      if (reminder.type === 'wakeup') {
        icon = '🌅';
      } else if (reminder.type === 'goal') {
        icon = '🎯';
      } else if (reminder.type === 'coach') {
        icon = '✨';
        // For coach reminders, get today's tip dynamically
        motivationalBody = reminder.body;
      }
      
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
