import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/useGoals";
import { Target, Plus, Trophy, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import { format, addDays, addMonths } from "date-fns";
import { he } from "date-fns/locale";

export const GoalsTracking = () => {
  const { activeGoals, completedGoals, expiredGoals, addGoal, deleteGoal, isLoading } = useGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    goal_type: "weekly" as "weekly" | "monthly",
    target_count: 7,
    reward_points: 50,
    category: "",
  });

  const handleAddGoal = async () => {
    if (!newGoal.title || newGoal.target_count <= 0) return;

    const endDate = newGoal.goal_type === "weekly" 
      ? addDays(new Date(), 7) 
      : addMonths(new Date(), 1);

    await addGoal.mutateAsync({
      ...newGoal,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
    });

    setNewGoal({
      title: "",
      description: "",
      goal_type: "weekly",
      target_count: 7,
      reward_points: 50,
      category: "",
    });
    setIsDialogOpen(false);
  };

  const GoalCard = ({ goal, status }: { goal: any; status: "active" | "completed" | "expired" }) => {
    const progress = (goal.current_count / goal.target_count) * 100;
    const daysLeft = Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className={`glass-card animate-fade-in ${
        status === "completed" ? "border-success/40" : 
        status === "expired" ? "border-destructive/40" : 
        "border-primary/20"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {status === "completed" && <CheckCircle2 className="w-5 h-5 text-success" />}
                {status === "expired" && <Calendar className="w-5 h-5 text-destructive" />}
                {status === "active" && <Target className="w-5 h-5 text-primary" />}
                {goal.title}
              </CardTitle>
              {goal.description && (
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteGoal.mutate(goal.id)}
              className="hover-scale"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">התקדמות</span>
              <span className="font-medium">
                {goal.current_count} / {goal.target_count}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" />
              <span>{goal.reward_points} נקודות</span>
            </div>
            {status === "active" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{daysLeft} ימים נותרו</span>
              </div>
            )}
            {status === "completed" && goal.completed_at && (
              <span className="text-success">
                הושלם ב-{format(new Date(goal.completed_at), "dd/MM/yyyy", { locale: he })}
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {goal.goal_type === "weekly" ? "יעד שבועי" : "יעד חודשי"}
            {goal.category && ` • ${goal.category}`}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div>טוען יעדים...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            היעדים שלי
          </h2>
          <p className="text-muted-foreground">הגדר יעדים והשג תגמולים</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-scale gap-2">
              <Plus className="w-4 h-4" />
              יעד חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>הוספת יעד חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">שם היעד</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="לדוגמה: להשלים 10 הרגלים"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="תאר את היעד שלך"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal_type">סוג יעד</Label>
                  <Select
                    value={newGoal.goal_type}
                    onValueChange={(value: "weekly" | "monthly") =>
                      setNewGoal({ ...newGoal, goal_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">שבועי</SelectItem>
                      <SelectItem value="monthly">חודשי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_count">יעד</Label>
                  <Input
                    id="target_count"
                    type="number"
                    min="1"
                    value={newGoal.target_count}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, target_count: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward_points">נקודות תגמול</Label>
                  <Input
                    id="reward_points"
                    type="number"
                    min="0"
                    value={newGoal.reward_points}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, reward_points: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">קטגוריה (אופציונלי)</Label>
                  <Input
                    id="category"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    placeholder="לדוגמה: בריאות"
                  />
                </div>
              </div>

              <Button onClick={handleAddGoal} className="w-full">
                הוסף יעד
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">יעדים פעילים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} status="active" />
            ))}
          </div>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-success">יעדים שהושגו</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} status="completed" />
            ))}
          </div>
        </div>
      )}

      {expiredGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-destructive">יעדים שפג תוקפם</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} status="expired" />
            ))}
          </div>
        </div>
      )}

      {activeGoals.length === 0 && completedGoals.length === 0 && expiredGoals.length === 0 && (
        <Card className="glass-card text-center py-12">
          <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">עדיין לא הגדרת יעדים. התחל עכשיו!</p>
        </Card>
      )}
    </div>
  );
};
