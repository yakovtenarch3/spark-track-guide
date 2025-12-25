import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  estimated_duration: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_days: number[] | null;
  started_at: string | null;
  completed_at: string | null;
  actual_duration: number | null;
  tags: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string;
  icon: string;
  order_index: number;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string;
  completed_time: string;
  was_on_time: boolean;
  actual_duration: number | null;
  difficulty_rating: number | null;
  energy_level: number | null;
  day_of_week: number;
  hour_of_day: number;
  notes: string | null;
  created_at: string;
}

export interface TaskFailure {
  id: string;
  task_id: string;
  user_id: string;
  failed_date: string;
  reason: string | null;
  day_of_week: number;
  hour_of_day: number;
  created_at: string;
}

// ============================================
// useTasks Hook
// ============================================

export const useTasks = () => {
  const queryClient = useQueryClient();

  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as TaskCategory[];
    },
  });

  // Add task
  const addTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { error } = await supabase
        .from('tasks')
        .insert([task]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('משימה נוספה בהצלחה');
    },
    onError: () => toast.error('שגיאה בהוספת משימה'),
  });

  // Update task
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error('שגיאה בעדכון משימה'),
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('משימה נמחקה');
    },
    onError: () => toast.error('שגיאה במחיקת משימה'),
  });

  // Complete task
  const completeTask = useMutation({
    mutationFn: async ({
      taskId,
      difficulty,
      energy,
      notes,
    }: {
      taskId: string;
      difficulty?: number;
      energy?: number;
      notes?: string;
    }) => {
      const now = new Date();
      
      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: now.toISOString(),
        })
        .eq('id', taskId);
      
      if (taskError) throw taskError;

      // Add completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert([{
          task_id: taskId,
          completed_date: now.toISOString().split('T')[0],
          completed_time: now.toTimeString().split(' ')[0],
          difficulty_rating: difficulty,
          energy_level: energy,
          notes,
        }]);
      
      if (completionError) throw completionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-analytics'] });
      toast.success('🎉 משימה הושלמה!');
    },
    onError: () => toast.error('שגיאה בהשלמת משימה'),
  });

  // Add category
  const addCategory = useMutation({
    mutationFn: async (category: Partial<TaskCategory>) => {
      const { error } = await supabase
        .from('task_categories')
        .insert([category]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast.success('קטגוריה נוספה');
    },
    onError: () => toast.error('שגיאה בהוספת קטגוריה'),
  });

  // Get tasks by status
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  };

  // Get tasks by category
  const getTasksByCategory = (categoryId: string) => {
    return tasks.filter(t => t.category_id === categoryId);
  };

  // Get tasks for today
  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.due_date === today && t.status !== 'completed');
  };

  // Get overdue tasks
  const getOverdueTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => 
      t.due_date && 
      t.due_date < today && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    );
  };

  return {
    tasks,
    categories,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addCategory,
    getTasksByStatus,
    getTasksByCategory,
    getTodayTasks,
    getOverdueTasks,
  };
};
