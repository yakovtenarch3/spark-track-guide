import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Archive as ArchiveIcon } from "lucide-react";

export default function Archive() {
  const { data: archivedHabits = [], isLoading } = useQuery({
    queryKey: ["archived-habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 flex items-center justify-center">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <ArchiveIcon className="h-8 w-8" />
          ארכיון הרגלים
        </h1>

        {archivedHabits.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">אין הרגלים בארכיון</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archivedHabits.map((habit) => (
              <Card key={habit.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{habit.title}</h3>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mb-2">{habit.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>רצף: {habit.streak} ימים</span>
                      <span>•</span>
                      <span>{habit.category}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
