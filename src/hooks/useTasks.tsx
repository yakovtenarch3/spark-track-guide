import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Local storage helpers
const TASKS_KEY = "local_tasks";
const CATEGORIES_KEY = "local_task_categories";
const COMPLETIONS_KEY = "local_task_completions";

const getLocalTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

const getLocalCategories = (): TaskCategory[] => {
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalCategories = (categories: TaskCategory[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

const getLocalCompletions = (): TaskCompletion[] => {
  try {
    const stored = localStorage.getItem(COMPLETIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalCompletions = (completions: TaskCompletion[]) => {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
};

// ============================================
// useTasks Hook
// ============================================

export const useTasks = () => {
  const queryClient = useQueryClient();

  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      return getLocalTasks().sort((a, b) => a.order_index - b.order_index);
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async (): Promise<TaskCategory[]> => {
      return getLocalCategories().sort((a, b) => a.order_index - b.order_index);
    },
  });

  // Add task
  const addTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const tasks = getLocalTasks();
      const newTask: Task = {
        id: crypto.randomUUID(),
        user_id: "local",
        category_id: task.category_id || null,
        title: task.title || "",
        description: task.description || null,
        due_date: task.due_date || null,
        due_time: task.due_time || null,
        estimated_duration: task.estimated_duration || null,
        priority: task.priority || "medium",
        status: task.status || "pending",
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || null,
        recurrence_days: task.recurrence_days || null,
        started_at: task.started_at || null,
        completed_at: task.completed_at || null,
        actual_duration: task.actual_duration || null,
        tags: task.tags || [],
        order_index: task.order_index || tasks.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      tasks.push(newTask);
      saveLocalTasks(tasks);
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
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates, updated_at: new Date().toISOString() };
        saveLocalTasks(tasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error('שגיאה בעדכון משימה'),
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const tasks = getLocalTasks();
      const filtered = tasks.filter(t => t.id !== id);
      saveLocalTasks(filtered);
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
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === taskId);
      
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          status: 'completed',
          completed_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
        saveLocalTasks(tasks);
      }

      // Add completion record
      const completions = getLocalCompletions();
      const completion: TaskCompletion = {
        id: crypto.randomUUID(),
        task_id: taskId,
        user_id: "local",
        completed_date: now.toISOString().split('T')[0],
        completed_time: now.toTimeString().split(' ')[0],
        was_on_time: true,
        actual_duration: null,
        difficulty_rating: difficulty || null,
        energy_level: energy || null,
        day_of_week: now.getDay(),
        hour_of_day: now.getHours(),
        notes: notes || null,
        created_at: now.toISOString(),
      };
      completions.push(completion);
      saveLocalCompletions(completions);
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
      const categories = getLocalCategories();
      const newCategory: TaskCategory = {
        id: crypto.randomUUID(),
        user_id: "local",
        name: category.name || "",
        parent_id: category.parent_id || null,
        color: category.color || "#6366f1",
        icon: category.icon || "folder",
        order_index: category.order_index || categories.length,
        created_at: new Date().toISOString(),
      };
      categories.push(newCategory);
      saveLocalCategories(categories);
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
