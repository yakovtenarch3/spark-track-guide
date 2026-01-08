import { getRandomQuote } from "@/data/motivationalQuotes";

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show a push notification
export const showPushNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: icon || '/favicon.ico',
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }
};

// Save timer reminders to localStorage for the scheduler to pick up
export const saveTimerReminder = (reminder: {
  goalId: string;
  topicName: string;
  time: string;
  days: number[];
  enabled: boolean;
}) => {
  const reminders = getTimerReminders();
  const existingIndex = reminders.findIndex((r: any) => r.goalId === reminder.goalId);
  
  if (reminder.enabled) {
    if (existingIndex >= 0) {
      reminders[existingIndex] = reminder;
    } else {
      reminders.push(reminder);
    }
  } else {
    if (existingIndex >= 0) {
      reminders.splice(existingIndex, 1);
    }
  }
  
  localStorage.setItem('timerReminders', JSON.stringify(reminders));
};

// Remove timer reminder
export const removeTimerReminder = (goalId: string) => {
  const reminders = getTimerReminders();
  const filtered = reminders.filter((r: any) => r.goalId !== goalId);
  localStorage.setItem('timerReminders', JSON.stringify(filtered));
};

// Get timer reminders from localStorage
export const getTimerReminders = () => {
  return JSON.parse(localStorage.getItem('timerReminders') || '[]');
};

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

const checkAndShowReminders = async () => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday

  // Check habit reminders
  const habitReminders = JSON.parse(localStorage.getItem('habitReminders') || '[]');
  // Check goal reminders
  const goalReminders = JSON.parse(localStorage.getItem('goalReminders') || '[]');
  // Check wake-up reminder
  const wakeUpReminder = JSON.parse(localStorage.getItem('wakeUpReminder') || 'null');
  // Check coach reminders
  const coachReminders = JSON.parse(localStorage.getItem('coachReminders') || '[]');
  // Check timer reminders
  const timerReminders = getTimerReminders();
  
  const allReminders = [...habitReminders, ...goalReminders, ...coachReminders];
  
  // Add wake-up reminder if exists
  if (wakeUpReminder) {
    allReminders.push(wakeUpReminder);
  }

  // Process standard reminders
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
      showPushNotification(
        `${icon} תזכורת: ${reminder.title}`,
        motivationalBody
      );
    }
  });

  // Process timer reminders
  timerReminders.forEach((reminder: any) => {
    if (!reminder.enabled) return;
    
    // Check if today is in the reminder days
    if (!reminder.days.includes(currentDay)) return;
    
    // Parse reminder time
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    if (hours === currentHours && minutes === currentMinutes) {
      const quote = getRandomQuote();
      showPushNotification(
        `⏱️ תזכורת טיימר: ${reminder.topicName}`,
        `הגיע הזמן לעבוד על ${reminder.topicName}!\n\n💪 ${quote.text}\n- ${quote.author}`
      );
    }
  });
};
