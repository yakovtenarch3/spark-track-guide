import { useState } from "react";
import { useHabits } from "@/hooks/useHabits";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { HabitCard } from "@/components/HabitCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Statistics } from "@/components/Statistics";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { HabitTemplate } from "@/data/habitTemplates";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Habits() {
  const { habits, isLoading, addHabit, toggleHabit, deleteHabit, updateReminder } = useHabits();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredHabits =
    selectedCategory === "all"
      ? habits
      : habits.filter((habit) => habit.category === selectedCategory);

  const handleAddHabit = (
    title: string,
    description: string,
    category: string,
    color: string,
    preferredTime?: string
  ) => {
    addHabit({
      title,
      description,
      category,
      color,
      preferred_time: preferredTime,
    });
  };

  const handleToggle = (habitId: string, isCompleted: boolean) => {
    toggleHabit({ habitId, isCompleted });
  };

  const handleUpdateReminder = (
    habitId: string,
    reminderEnabled: boolean,
    reminderTime?: string
  ) => {
    updateReminder({ habitId, reminderEnabled, reminderTime });
  };

  const handleAddHabitFromTemplate = (template: HabitTemplate) => {
    addHabit({
      title: template.title,
      description: template.description,
      category: template.category,
      color: template.color,
      preferred_time: template.preferredTime,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 flex items-center justify-center">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold">ההרגלים שלי</h1>
          <div className="flex gap-3">
            <TemplateLibrary onAddHabitFromTemplate={handleAddHabitFromTemplate} />
            <AddHabitDialog onAddHabit={handleAddHabit}>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                הרגל חדש
              </Button>
            </AddHabitDialog>
          </div>
        </div>

        <Statistics />

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {filteredHabits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {selectedCategory === "all"
                ? "טרם נוספו הרגלים. התחל על ידי הוספת הרגל ראשון!"
                : "אין הרגלים בקטגוריה זו"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={deleteHabit}
                onUpdateReminder={handleUpdateReminder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
