import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfDay, startOfWeek, isToday, isSameDay, subDays } from 'date-fns';

export interface TimerTopic {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface TimerSession {
  id: string;
  topic_id: string | null;
  topic_name: string;
  title: string | null;
  notes: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface TimerGoal {
  id: string;
  topic_id: string;
  daily_target_minutes: number;
  weekly_target_minutes: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_days: number[];
  created_at: string;
  updated_at: string;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  currentTopic: TimerTopic | null;
  startedAt: Date | null;
  isCountdown: boolean;
  countdownDuration: number;
  remainingSeconds: number;
}

export interface TopicWithStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  sessionCount: number;
  totalTime: number;
  todayMinutes: number;
  weekMinutes: number;
  goal?: TimerGoal;
}

export function useTimer() {
  const queryClient = useQueryClient();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    currentTopic: null,
    startedAt: null,
    isCountdown: false,
    countdownDuration: 0,
    remainingSeconds: 0,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['timer-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timer_topics')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TimerTopic[];
    },
  });

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['timer-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TimerSession[];
    },
  });

  // Fetch goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['timer-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timer_goals')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TimerGoal[];
    },
  });

  // Calculate topics with stats
  const topicsWithStats: TopicWithStats[] = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });

    return topics.map((topic) => {
      const topicSessions = sessions.filter((s) => s.topic_id === topic.id);
      const totalTime = topicSessions.reduce((acc, s) => acc + s.duration_seconds, 0);

      const todaySessions = topicSessions.filter((s) =>
        isToday(new Date(s.created_at))
      );
      const todaySeconds = todaySessions.reduce(
        (acc, s) => acc + s.duration_seconds,
        0
      );

      const weekSessions = topicSessions.filter(
        (s) => new Date(s.created_at) >= weekStart
      );
      const weekSeconds = weekSessions.reduce(
        (acc, s) => acc + s.duration_seconds,
        0
      );

      const goal = goals.find((g) => g.topic_id === topic.id);

      return {
        ...topic,
        sessionCount: topicSessions.length,
        totalTime,
        todayMinutes: Math.round(todaySeconds / 60),
        weekMinutes: Math.round(weekSeconds / 60),
        goal,
      };
    });
  }, [topics, sessions, goals]);

  // Add topic mutation
  const addTopicMutation = useMutation({
    mutationFn: async (topic: { name: string; color: string; icon: string }) => {
      const { data, error } = await supabase
        .from('timer_topics')
        .insert([topic])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-topics'] });
      toast.success('נושא נוסף בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בהוספת נושא');
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from('timer_topics')
        .delete()
        .eq('id', topicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-topics'] });
      toast.success('נושא נמחק');
    },
    onError: () => {
      toast.error('שגיאה במחיקת נושא');
    },
  });

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: async (session: {
      topic_id: string | null;
      topic_name: string;
      title: string | null;
      notes: string | null;
      duration_seconds: number;
      started_at: string;
    }) => {
      const { data, error } = await supabase
        .from('timer_sessions')
        .insert([session])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-sessions'] });
      toast.success('הזמן נשמר בהצלחה!');
    },
    onError: () => {
      toast.error('שגיאה בשמירת הזמן');
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('timer_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-sessions'] });
      toast.success('רשומה נמחקה');
    },
    onError: () => {
      toast.error('שגיאה במחיקת רשומה');
    },
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goal: Omit<TimerGoal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('timer_goals')
        .insert([goal])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-goals'] });
      toast.success('יעד נוסף בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בהוספת יעד');
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TimerGoal>;
    }) => {
      const { data, error } = await supabase
        .from('timer_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-goals'] });
      toast.success('יעד עודכן');
    },
    onError: () => {
      toast.error('שגיאה בעדכון יעד');
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('timer_goals')
        .delete()
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-goals'] });
      toast.success('יעד נמחק');
    },
    onError: () => {
      toast.error('שגיאה במחיקת יעד');
    },
  });

  // Timer controls
  const startTimer = useCallback((topic: TimerTopic, countdownSeconds?: number) => {
    setTimerState({
      isRunning: true,
      isPaused: false,
      elapsedSeconds: 0,
      currentTopic: topic,
      startedAt: new Date(),
      isCountdown: !!countdownSeconds,
      countdownDuration: countdownSeconds || 0,
      remainingSeconds: countdownSeconds || 0,
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const finalState = { ...timerState };
    setTimerState({
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      currentTopic: null,
      startedAt: null,
      isCountdown: false,
      countdownDuration: 0,
      remainingSeconds: 0,
    });
    return finalState;
  }, [timerState]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState({
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      currentTopic: null,
      startedAt: null,
      isCountdown: false,
      countdownDuration: 0,
      remainingSeconds: 0,
    });
  }, []);

  // Countdown complete callback ref
  const onCountdownCompleteRef = useRef<(() => void) | null>(null);

  const setOnCountdownComplete = useCallback((callback: (() => void) | null) => {
    onCountdownCompleteRef.current = callback;
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.isCountdown) {
            const newRemaining = prev.remainingSeconds - 1;
            if (newRemaining <= 0) {
              // Countdown complete - trigger notification
              if (onCountdownCompleteRef.current) {
                onCountdownCompleteRef.current();
              }
              return {
                ...prev,
                elapsedSeconds: prev.elapsedSeconds + 1,
                remainingSeconds: 0,
              };
            }
            return {
              ...prev,
              elapsedSeconds: prev.elapsedSeconds + 1,
              remainingSeconds: newRemaining,
            };
          }
          return {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
          };
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    topics,
    sessions,
    goals,
    topicsWithStats,
    topicsLoading,
    sessionsLoading,
    goalsLoading,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    addTopic: addTopicMutation.mutate,
    deleteTopic: deleteTopicMutation.mutate,
    saveSession: saveSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    addGoal: addGoalMutation.mutate,
    updateGoal: (id: string, updates: Partial<TimerGoal>) =>
      updateGoalMutation.mutate({ id, updates }),
    deleteGoal: deleteGoalMutation.mutate,
    formatTime,
    setOnCountdownComplete,
  };
}
