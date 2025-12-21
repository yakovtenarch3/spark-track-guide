import { Card } from "@/components/ui/card";
import { useAchievements } from "@/hooks/useAchievements";
import { Lock } from "lucide-react";

export const Achievements = () => {
  const { achievements, isLoading } = useAchievements();

  if (isLoading) {
    return <div className="text-center">טוען הישגים...</div>;
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">הישגים</h2>
        <div className="text-sm text-muted-foreground">
          {unlockedCount} / {totalCount} ({percentage}%)
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`
              p-4 rounded-lg text-center transition-[var(--transition)]
              ${
                achievement.unlocked
                  ? "bg-success/10 hover:bg-success/20 border border-success/40"
                  : "bg-muted/30 hover:bg-muted/50 border border-border"
              }
            `}
          >
            <div className="text-4xl mb-2 relative">
              {achievement.unlocked ? (
                achievement.icon
              ) : (
                <div className="relative">
                  <span className="opacity-30">{achievement.icon}</span>
                  <Lock className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
            </div>
            <div
              className={`text-sm font-semibold mb-1 ${
                achievement.unlocked ? "text-success" : "text-muted-foreground"
              }`}
            >
              {achievement.name}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {achievement.description}
            </div>
            <div className="text-xs text-primary mt-2 font-medium">
              +{achievement.points} נקודות
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
