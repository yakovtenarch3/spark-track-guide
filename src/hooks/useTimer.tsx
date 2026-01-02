import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  currentTopic: TimerTopic | null;
  startedAt: Date | null;
}

export function useTimer() {
  const queryClient = useQueryClient();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    currentTopic: null,
    startedAt: null,
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

  // Timer controls
  const startTimer = useCallback((topic: TimerTopic) => {
    setTimerState({
      isRunning: true,
      isPaused: false,
      elapsedSeconds: 0,
      currentTopic: topic,
      startedAt: new Date(),
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
    });
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
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
    topicsLoading,
    sessionsLoading,
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
    formatTime,
  };
}
