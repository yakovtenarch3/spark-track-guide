import { useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Briefcase,
  Book,
  BookOpen,
  Dumbbell,
  Heart,
  Rocket,
  MoreVertical,
  Edit3,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TopicWithStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  sessionCount: number;
  totalTime: number;
  todayMinutes: number;
  weekMinutes: number;
}

interface TopicCardsProps {
  topicsWithStats: TopicWithStats[];
  formatTime: (seconds: number) => string;
  onAddTopic: (topic: { name: string; color: string; icon: string }) => void;
  onDeleteTopic: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  book: Book,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  heart: Heart,
  rocket: Rocket,
  clock: Clock,
};

const iconOptions = [
  { value: "clock", icon: Clock, label: "שעון" },
  { value: "briefcase", icon: Briefcase, label: "עבודה" },
  { value: "book", icon: Book, label: "לימודים" },
  { value: "book-open", icon: BookOpen, label: "קריאה" },
  { value: "dumbbell", icon: Dumbbell, label: "ספורט" },
  { value: "heart", icon: Heart, label: "בריאות" },
  { value: "rocket", icon: Rocket, label: "פרויקט" },
];

export function TopicCards({
  topicsWithStats,
  formatTime,
  onAddTopic,
  onDeleteTopic,
}: TopicCardsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicColor, setNewTopicColor] = useState("#8B5CF6");
  const [newTopicIcon, setNewTopicIcon] = useState("clock");

  const handleAdd = () => {
    if (newTopicName.trim()) {
      onAddTopic({
        name: newTopicName.trim(),
        color: newTopicColor,
        icon: newTopicIcon,
      });
      setNewTopicName("");
      setNewTopicColor("#8B5CF6");
      setNewTopicIcon("clock");
      setShowAddDialog(false);
    }
  };

  const getTopicIcon = (iconName: string) => {
    return iconMap[iconName] || Clock;
  };

  // Sort topics by total time
  const sortedTopics = [...topicsWithStats].sort(
    (a, b) => b.totalTime - a.totalTime
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            נושאים
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Plus className="h-4 w-4 ml-2" />
            נושא חדש
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {sortedTopics.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Clock className="h-10 w-10 text-primary/50" />
              </div>
              <div>
                <p className="text-muted-foreground">אין נושאים עדיין</p>
                <p className="text-sm text-muted-foreground/70">
                  הוסף נושא כדי להתחיל לעקוב אחרי הזמן
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedTopics.map((topic, index) => {
                const TopicIcon = getTopicIcon(topic.icon);
                const isTopPerformer = index === 0 && topic.totalTime > 0;

                return (
                  <Card
                    key={topic.id}
                    className={cn(
                      "relative group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                      isTopPerformer && "ring-2 ring-yellow-500/50"
                    )}
                  >
                    {isTopPerformer && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400" />
                    )}
                    <CardContent className="pt-6 pb-4">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                          <div
                            className="p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${topic.color}, ${topic.color}cc)`,
                            }}
                          >
                            <TopicIcon className="h-7 w-7 text-white" />
                          </div>
                          {isTopPerformer && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                              <TrendingUp className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg">{topic.name}</h3>

                        <div className="space-y-1 text-sm">
                          <div className="font-mono text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {formatTime(topic.totalTime)}
                          </div>
                          <div className="text-muted-foreground">
                            {topic.sessionCount} מפגשים
                          </div>
                        </div>

                        {topic.todayMinutes > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600 border-green-500/30"
                          >
                            היום: {topic.todayMinutes} דק׳
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-background/80 backdrop-blur"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteTopic(topic.id)}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              מחק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Topic Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              נושא חדש
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>שם הנושא</Label>
              <Input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="לדוגמה: קריאה, עבודה, לימודים..."
              />
            </div>

            <div className="space-y-2">
              <Label>אייקון</Label>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map((option) => {
                  const IconComp = option.icon;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={newTopicIcon === option.value ? "default" : "outline"}
                      className={cn(
                        "h-14 flex flex-col items-center gap-1",
                        newTopicIcon === option.value && "ring-2 ring-primary"
                      )}
                      onClick={() => setNewTopicIcon(option.value)}
                    >
                      <IconComp className="h-5 w-5" />
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>צבע</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={newTopicColor}
                  onChange={(e) => setNewTopicColor(e.target.value)}
                  className="w-16 h-16 rounded-xl cursor-pointer border-0 shadow-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    "#8B5CF6",
                    "#EC4899",
                    "#3B82F6",
                    "#10B981",
                    "#F59E0B",
                    "#EF4444",
                    "#6366F1",
                    "#14B8A6",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform hover:scale-110",
                        newTopicColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTopicColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <Label className="text-xs text-muted-foreground mb-2 block">
                תצוגה מקדימה
              </Label>
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-xl shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${newTopicColor}, ${newTopicColor}cc)`,
                  }}
                >
                  {(() => {
                    const PreviewIcon = iconMap[newTopicIcon] || Clock;
                    return <PreviewIcon className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <span className="font-medium">
                  {newTopicName || "שם הנושא"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newTopicName.trim()}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
