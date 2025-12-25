import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

export const useAccountabilityTracking = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Start a new session when component mounts
  useEffect(() => {
    startSession();
    
    // End session on unmount
    return () => {
      if (currentSessionId) {
        endSession(currentSessionId);
      }
    };
  }, []);

  // Track page visits
  useEffect(() => {
    const trackPageView = () => {
      if (currentSessionId) {
        trackActivity({
          activity_type: "page_view",
          activity_category: "navigation",
          metadata: { page: window.location.pathname },
        });
      }
    };

    trackPageView();
    window.addEventListener("popstate", trackPageView);
    
    return () => {
      window.removeEventListener("popstate", trackPageView);
    };
  }, [currentSessionId]);

  // Start new session
  const startSession = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userData.user.id,
          pages_visited: [window.location.pathname],
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSessionId(data.id);

      // Update today's engagement metrics
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("engagement_metrics")
        .upsert({
          user_id: userData.user.id,
          date: today,
          logged_in: true,
          login_time: new Date().toISOString(),
        }, { onConflict: "user_id,date" });
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  // End session
  const endSession = async (sessionId: string) => {
    try {
      const { data: session } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session) return;

      const duration = Math.floor(
        (new Date().getTime() - new Date(session.session_start).getTime()) / 60000
      );

      await supabase
        .from("user_sessions")
        .update({
          session_end: new Date().toISOString(),
          duration_minutes: duration,
        })
        .eq("id", sessionId);

      // Update today's metrics
      const today = new Date().toISOString().split("T")[0];
      await supabase.rpc("update_session_duration", {
        p_user_id: session.user_id,
        p_date: today,
        p_additional_minutes: duration,
      });
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Track activity
  const trackActivity = async (activity: {
    activity_type: string;
    activity_category: string;
    activity_id?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      await supabase.from("activity_tracking").insert({
        user_id: userData.user.id,
        session_id: currentSessionId,
        ...activity,
      });
    } catch (error) {
      console.error("Error tracking activity:", error);
    }
  };

  // Get engagement metrics
  const { data: metrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ["engagement-metrics"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("engagement_metrics")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as EngagementMetrics[];
    },
  });

  // Get sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("session_start", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as UserSession[];
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
