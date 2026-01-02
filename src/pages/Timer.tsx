import { useState } from "react";
import { Timer as TimerIcon, Clock, Trash2, Plus, Briefcase, Book, BookOpen, Dumbbell, Heart, Rocket, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTimer, TimerTopic } from "@/hooks/useTimer";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  book: Book,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  heart: Heart,
  rocket: Rocket,
  clock: Clock,
};

export default function Timer() {
  const {
    topics,
    sessions,
    topicsLoading,
    sessionsLoading,
    addTopic,
    deleteTopic,
    deleteSession,
    formatTime,
  } = useTimer();

  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicColor, setNewTopicColor] = useState("#8B5CF6");

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addTopic({
        name: newTopicName.trim(),
        color: newTopicColor,
        icon: "clock",
      });
      setNewTopicName("");
      setNewTopicColor("#8B5CF6");
      setShowAddTopic(false);
    }
  };

  const getTopicIcon = (iconName: string) => {
    return iconMap[iconName] || Clock;
  };

  // Calculate stats
  const totalSeconds = sessions.reduce((acc, s) => acc + s.duration_seconds, 0);
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.created_at);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });
  const todaySeconds = todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0);

  // Group by topic
  const topicStats = topics.map(topic => {
    const topicSessions = sessions.filter(s => s.topic_id === topic.id);
    const totalTime = topicSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    return {
      ...topic,
      sessionCount: topicSessions.length,
      totalTime,
    };
  }).sort((a, b) => b.totalTime - a.totalTime);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TimerIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">טיימר</h1>
            <p className="text-muted-foreground">עקוב אחרי הזמן שלך</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה"כ זמן</p>
                <p className="text-2xl font-bold font-mono">{formatTime(totalSeconds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">היום</p>
                <p className="text-2xl font-bold font-mono">{formatTime(todaySeconds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <BarChart3 className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">מפגשים</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topics Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5" />
            נושאים
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddTopic(true)}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף נושא
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topicStats.map((topic) => {
              const TopicIcon = getTopicIcon(topic.icon);
              return (
                <Card key={topic.id} className="relative group">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div
                        className="p-3 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      >
                        <TopicIcon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-medium">{topic.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{formatTime(topic.totalTime)}</span>
                        <span className="mx-1">•</span>
                        <span>{topic.sessionCount} מפגשים</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteTopic(topic.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sessions History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            היסטוריית מפגשים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין מפגשים עדיין</p>
              <p className="text-sm">לחץ על כפתור הטיימר הצף כדי להתחיל</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">נושא</TableHead>
                    <TableHead className="text-right">כותרת</TableHead>
                    <TableHead className="text-right">משך</TableHead>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-right">הערות</TableHead>
                    <TableHead className="text-right w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const topic = topics.find(t => t.id === session.topic_id);
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: topic?.color,
                              color: topic?.color,
                            }}
                          >
                            {session.topic_name}
                          </Badge>
                        </TableCell>
                        <TableCell>{session.title || "-"}</TableCell>
                        <TableCell className="font-mono">
                          {formatTime(session.duration_seconds)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(session.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {session.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add Topic Dialog */}
      <Dialog open={showAddTopic} onOpenChange={setShowAddTopic}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף נושא חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>שם הנושא</Label>
              <Input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="לדוגמה: קריאה, עבודה..."
              />
            </div>
            <div className="space-y-2">
              <Label>צבע</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newTopicColor}
                  onChange={(e) => setNewTopicColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0"
                />
                <span className="text-sm text-muted-foreground">{newTopicColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTopic(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddTopic}>
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
