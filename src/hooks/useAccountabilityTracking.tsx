import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  pages_visited: string[];
  actions_count: number;
  created_at: string;
}

interface EngagementMetrics {
  id: string;
  user_id: string;
  date: string;
  logged_in: boolean;
  login_time?: string;
  total_session_minutes: number;
  habits_completed: number;
  tasks_completed: number;
  goals_tracked: number;
  journal_entries: number;
  engagement_score: number;
  current_streak: number;
}

interface EngagementAnalytics {
  // Overall stats
  totalSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  currentStreak: number;
  longestStreak: number;
  
  // Activity stats
  totalHabits: number;
  totalTasks: number;
  totalGoals: number;
  totalJournalEntries: number;
  
  // Patterns
  bestDays: Array<{ day: string; score: number }>;
  worstDays: Array<{ day: string; score: number }>;
  engagementTrend: Array<{ date: string; score: number }>;
  
  // Alerts
  missedDays: number;
  lowEngagementDays: number;
  recommendations: string[];
}

// Stub implementation - tables don't exist in schema
export const useAccountabilityTracking = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // No-op effect since tables don't exist
  useEffect(() => {
    // Session tracking disabled - tables not in schema
  }, []);

  // Track activity (no-op)
  const trackActivity = async (_activity: {
    activity_type: string;
    activity_category: string;
    activity_id?: string;
    metadata?: Record<string, unknown>;
  }) => {
    // No-op - tables don't exist
  };

  // Get engagement metrics (empty data)
  const { data: metrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ["engagement-metrics"],
    queryFn: async (): Promise<EngagementMetrics[]> => {
      // Return empty - tables don't exist
      return [];
    },
  });

  // Get sessions (empty data)
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: async (): Promise<UserSession[]> => {
      // Return empty - tables don't exist
      return [];
    },
  });

  // Calculate analytics
  const analytics: EngagementAnalytics = {
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    averageSessionMinutes: sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
      : 0,
    currentStreak: metrics[0]?.current_streak || 0,
    longestStreak: Math.max(...metrics.map((m) => m.current_streak), 0),
    
    totalHabits: metrics.reduce((sum, m) => sum + m.habits_completed, 0),
    totalTasks: metrics.reduce((sum, m) => sum + m.tasks_completed, 0),
    totalGoals: metrics.reduce((sum, m) => sum + m.goals_tracked, 0),
    totalJournalEntries: metrics.reduce((sum, m) => sum + m.journal_entries, 0),
    
    bestDays: metrics
      .filter((m) => m.engagement_score > 0)
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 5)
      .map((m) => ({ day: m.date, score: m.engagement_score })),
    
    worstDays: metrics
      .filter((m) => m.engagement_score < 30)
      .sort((a, b) => a.engagement_score - b.engagement_score)
      .slice(0, 5)
      .map((m) => ({ day: m.date, score: m.engagement_score })),
    
    engagementTrend: metrics
      .slice(0, 14)
      .reverse()
      .map((m) => ({ date: m.date, score: m.engagement_score })),
    
    missedDays: metrics.filter((m) => !m.logged_in).length,
    lowEngagementDays: metrics.filter((m) => m.engagement_score < 30).length,
    
    recommendations: generateRecommendations(metrics),
  };

  return {
    // Session tracking
    currentSessionId,
    trackActivity,
    
    // Data
    metrics,
    sessions,
    analytics,
    isLoading: metricsLoading || sessionsLoading,
  };
};

// Generate smart recommendations
function generateRecommendations(metrics: EngagementMetrics[]): string[] {
  const recommendations: string[] = [];
  
  if (metrics.length === 0) {
    return ["התחל לעקוב אחר הפעילות שלך כדי לקבל המלצות מותאמות אישית"];
  }

  const recentMetrics = metrics.slice(0, 7);
  const avgScore = recentMetrics.reduce((sum, m) => sum + m.engagement_score, 0) / recentMetrics.length;
  const missedDays = recentMetrics.filter((m) => !m.logged_in).length;
  const currentStreak = metrics[0]?.current_streak || 0;

  // Low engagement
  if (avgScore < 30) {
    recommendations.push("📉 רמת המעורבות שלך נמוכה. נסה להגדיר יעדים קטנים יותר");
  }

  // Missed days
  if (missedDays > 2) {
    recommendations.push(`⚠️ לא נכנסת ${missedDays} ימים בשבוע האחרון. הגדר תזכורת יומית`);
  }

  // Good streak
  if (currentStreak >= 7) {
    recommendations.push(`🔥 רצף מדהים של ${currentStreak} ימים! המשך כך`);
  } else if (currentStreak >= 3) {
    recommendations.push(`✨ רצף טוב של ${currentStreak} ימים - אל תפסיק עכשיו!`);
  }

  // Activity patterns
  const habitDays = recentMetrics.filter((m) => m.habits_completed > 0).length;
  if (habitDays < 3) {
    recommendations.push("🎯 נסה להשלים לפחות הרגל אחד ביום");
  }

  const journalDays = recentMetrics.filter((m) => m.journal_entries > 0).length;
  if (journalDays === 0) {
    recommendations.push("📔 כתיבה ביומן יכולה לעזור לך לעקוב אחר ההתקדמות");
  }

  // Time patterns
  const sessionMinutes = metrics.slice(0, 7).reduce((sum, m) => sum + m.total_session_minutes, 0);
  if (sessionMinutes < 60) {
    recommendations.push("⏱️ הקדש לפחות 10-15 דקות ביום למעקב");
  }

  return recommendations;
}
