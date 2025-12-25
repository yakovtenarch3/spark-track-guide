import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  Tag,
  Calendar,
  Flame,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskCategory } from "@/hooks/useTasks";

const PRIORITY_CONFIG = {
  low: { label: "נמוכה", color: "bg-blue-500", icon: Circle },
  medium: { label: "בינונית", color: "bg-yellow-500", icon: Clock },
  high: { label: "גבוהה", color: "bg-orange-500", icon: AlertCircle },
  urgent: { label: "דחוף!", color: "bg-red-500", icon: Flame },
};

const STATUS_CONFIG = {
  pending: { label: "ממתין", color: "bg-gray-400" },
  in_progress: { label: "בביצוע", color: "bg-blue-500" },
  completed: { label: "הושלם", color: "bg-green-500" },
  cancelled: { label: "בוטל", color: "bg-red-400" },
};

export const TaskBoard = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addCategory,
    getTodayTasks,
    getOverdueTasks,
  } = useTasks();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category_id: "",
    priority: "medium" as Task["priority"],
    due_date: "",
    due_time: "",
    estimated_duration: "",
    tags: [] as string[],
  });

  // New category form
  const [newCategory, setNewCategory] = useState({
    name: "",
    parent_id: null as string | null,
    color: "#3B82F6",
    icon: "📋",
  });

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error("נא להזין כותרת למשימה");
      return;
    }

    addTask.mutate({
      ...newTask,
      estimated_duration: newTask.estimated_duration ? parseInt(newTask.estimated_duration) : null,
      status: "pending",
    });

    setNewTask({
      title: "",
      description: "",
      category_id: "",
      priority: "medium",
      due_date: "",
      due_time: "",
      estimated_duration: "",
      tags: [],
    });
    setShowNewTaskDialog(false);
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("נא להזין שם לקטגוריה");
      return;
    }

    addCategory.mutate(newCategory);
    setNewCategory({
      name: "",
      parent_id: null,
      color: "#3B82F6",
      icon: "📋",
    });
    setShowNewCategoryDialog(false);
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask.mutate({ taskId });
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("האם למחוק משימה זו?")) {
      deleteTask.mutate(taskId);
    }
  };

  const handleUpdateStatus = (taskId: string, status: Task["status"]) => {
    updateTask.mutate({ id: taskId, updates: { status } });
  };

  // Filter tasks
  const filteredTasks = selectedCategory
    ? tasks.filter((t) => t.category_id === selectedCategory)
    : tasks;

  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();

  // Build category tree
  const rootCategories = categories.filter((c) => !c.parent_id);
  const getSubCategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const renderTaskCard = (task: Task) => {
    const category = categories.find((c) => c.id === task.category_id);
    const PriorityIcon = PRIORITY_CONFIG[task.priority].icon;

    return (
      <Card
        key={task.id}
        className="p-4 hover:shadow-lg transition-all cursor-pointer group"
        dir="rtl"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <PriorityIcon
              className={`w-4 h-4 ${PRIORITY_CONFIG[task.priority].color.replace("bg-", "text-")}`}
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {category && (
              <Badge variant="outline" className="gap-1">
                <span>{category.icon}</span>
                {category.name}
              </Badge>
            )}

            {task.due_date && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString("he-IL")}
              </Badge>
            )}

            {task.estimated_duration && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {task.estimated_duration}דק'
              </Badge>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleUpdateStatus(task.id, "in_progress")}
                >
                  התחל
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-green-600"
                  onClick={() => handleCompleteTask(task.id)}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  סיים
                </Button>
              </>
            )}

            {task.status === "in_progress" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-green-600"
                onClick={() => handleCompleteTask(task.id)}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                סיים
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive"
              onClick={() => handleDeleteTask(task.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">לוח המשימות</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} משימות כולל • {completedTasks.length} הושלמו
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                קטגוריה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת קטגוריה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="שם הקטגוריה"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <Input
                  placeholder="אייקון (אימוג'י)"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  maxLength={2}
                />
                <Input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                />
                <Select
                  value={newCategory.parent_id || "none"}
                  onValueChange={(v) =>
                    setNewCategory({ ...newCategory, parent_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="קטגוריית אב (אופציונלי)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא</SelectItem>
                    {rootCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddCategory} className="w-full">
                  הוסף קטגוריה
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                משימה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת משימה חדשה</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <Input
                    placeholder="כותרת המשימה *"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />

                  <Textarea
                    placeholder="תיאור (אופציונלי)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />

                  <Select
                    value={newTask.category_id}
                    onValueChange={(v) => setNewTask({ ...newTask, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v as Task["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="עדיפות" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={newTask.due_time}
                      onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                    />
                  </div>

                  <Input
                    type="number"
                    placeholder="זמן משוער (דקות)"
                    value={newTask.estimated_duration}
                    onChange={(e) => setNewTask({ ...newTask, estimated_duration: e.target.value })}
                  />

                  <Button onClick={handleAddTask} className="w-full" disabled={addTask.isPending}>
                    {addTask.isPending ? "מוסיף..." : "הוסף משימה"}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{todayTasks.length}</div>
          <div className="text-sm text-muted-foreground">משימות להיום</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{overdueTasks.length}</div>
          <div className="text-sm text-muted-foreground">באיחור</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{inProgressTasks.length}</div>
          <div className="text-sm text-muted-foreground">בביצוע</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <div className="text-sm text-muted-foreground">הושלמו</div>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!selectedCategory ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          הכל ({tasks.length})
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="gap-2"
          >
            <span>{cat.icon}</span>
            {cat.name} ({tasks.filter((t) => t.category_id === cat.id).length})
          </Button>
        ))}
      </div>

      {/* Tasks Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG.pending.color}`} />
              ממתין
            </h3>
            <Badge variant="secondary">{pendingTasks.length}</Badge>
          </div>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {pendingTasks.map(renderTaskCard)}
              {pendingTasks.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>אין משימות ממתינות</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* In Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG.in_progress.color}`} />
              בביצוע
            </h3>
            <Badge variant="secondary">{inProgressTasks.length}</Badge>
          </div>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {inProgressTasks.map(renderTaskCard)}
              {inProgressTasks.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>אין משימות בביצוע</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Completed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG.completed.color}`} />
              הושלם
            </h3>
            <Badge variant="secondary">{completedTasks.length}</Badge>
          </div>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {completedTasks.slice(0, 20).map(renderTaskCard)}
              {completedTasks.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>אין משימות שהושלמו</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
