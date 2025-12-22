import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@/data/motivationalQuotes";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("הדפדפן שלך לא תומך בהתראות");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("הרשאות התראות הופעלו בהצלחה! 🔔");
        return true;
      } else if (result === "denied") {
        toast.error("הרשאות התראות נדחו. ניתן לשנות זאת בהגדרות הדפדפן");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("שגיאה בבקשת הרשאות התראות");
      return false;
    }
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    time: string,
    habitId: string,
    type: "habit" | "goal" | "coach" = "habit"
  ) => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const storageKey = type === "habit" ? "habitReminders" : type === "goal" ? "goalReminders" : "coachReminders";
    const reminders = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const [hours, minutes] = time.split(":");
    
    const reminder = {
      habitId,
      title,
      body,
      time,
      hours: parseInt(hours),
      minutes: parseInt(minutes),
      type,
    };
    
    const existingIndex = reminders.findIndex((r: any) => r.habitId === habitId);
    if (existingIndex >= 0) {
      reminders[existingIndex] = reminder;
    } else {
      reminders.push(reminder);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(reminders));
    
    // Show immediate test notification with motivational quote
    if (Notification.permission === "granted") {
      const quote = getRandomQuote();
      new Notification(`תזכורת הוגדרה: ${title}`, {
        body: `תקבל תזכורת יומית בשעה ${time}\n\n💪 ${quote.text}`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  };

  const cancelNotification = (habitId: string, type: "habit" | "goal" | "coach" = "habit") => {
    const storageKey = type === "habit" ? "habitReminders" : type === "goal" ? "goalReminders" : "coachReminders";
    const reminders = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const filtered = reminders.filter((r: any) => r.habitId !== habitId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    toast.info("התזכורת בוטלה");
  };

  return {
    permission,
    isSupported,
    requestPermission,
    scheduleNotification,
    cancelNotification,
  };
};
