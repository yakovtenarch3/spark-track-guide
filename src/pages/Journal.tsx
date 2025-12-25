import { useState } from "react";
import { useJournal } from "@/hooks/useJournal";
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
  Lock,
  Unlock,
  Plus,
  BookOpen,
  Smile,
  Meh,
  Frown,
  Calendar,
  Tag,
  Trash2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const Journal = () => {
  const {
    isUnlocked,
    unlock,
    lock,
    entries,
    isLoading,
    addEntry,
    deleteEntry,
  } = useJournal();

  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New entry form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState<string>("");
  const [newTags, setNewTags] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(password)) {
      setPassword("");
    }
  };

  const handleAddEntry = () => {
    if (!newContent.trim()) return;

    addEntry.mutate({
      title: newTitle || undefined,
      content: newContent,
      mood: newMood || undefined,
      tags: newTags
        ? newTags.split(",").map((t) => t.trim())
        : undefined,
    });

    // Reset form
    setNewTitle("");
    setNewContent("");
    setNewMood("");
    setNewTags("");
    setIsDialogOpen(false);
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case "great":
        return <Smile className="w-5 h-5 text-green-600" />;
      case "good":
        return <Smile className="w-5 h-5 text-green-500" />;
      case "neutral":
        return <Meh className="w-5 h-5 text-yellow-600" />;
      case "bad":
        return <Frown className="w-5 h-5 text-orange-600" />;
      case "terrible":
        return <Frown className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getMoodText = (mood?: string) => {
    switch (mood) {
      case "great":
        return "מצוין";
      case "good":
        return "טוב";
      case "neutral":
        return "נייטרלי";
      case "bad":
        return "לא טוב";
      case "terrible":
        return "גרוע";
      default:
        return "";
    }
  };

  // Lock screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">היומן האישי שלי</h1>
            <p className="text-muted-foreground">הזן סיסמא לגישה ליומן</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4" dir="rtl">
            <div>
              <Input
                type="password"
                placeholder="הזן סיסמא..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Unlock className="w-4 h-4 mr-2" />
              פתח יומן
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              💡 רמז: המילה "הצלחה" בעברית
            </p>
          </form>
        </Card>
      </div>
    );
  }

  // Main journal view
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">היומן האישי שלי</h1>
                <p className="text-sm text-muted-foreground">
                  {entries.length} רשומות
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    רשומה חדשה
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>רשומה חדשה</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="כותרת (אופציונלי)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <Textarea
                        placeholder="כתוב כאן את המחשבות שלך..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={10}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Select value={newMood} onValueChange={setNewMood}>
                          <SelectTrigger>
                            <SelectValue placeholder="מצב רוח" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="great">😄 מצוין</SelectItem>
                            <SelectItem value="good">🙂 טוב</SelectItem>
                            <SelectItem value="neutral">😐 נייטרלי</SelectItem>
                            <SelectItem value="bad">🙁 לא טוב</SelectItem>
                            <SelectItem value="terrible">😢 גרוע</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Input
                          placeholder="תגיות (מופרדות בפסיק)"
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        ביטול
                      </Button>
                      <Button onClick={handleAddEntry}>שמור רשומה</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={lock}>
                <Lock className="w-4 h-4 mr-2" />
                נעל יומן
              </Button>
            </div>
          </div>
        </Card>

        {/* Entries List */}
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">טוען...</p>
              </Card>
            ) : entries.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">היומן ריק</h3>
                <p className="text-muted-foreground mb-4">
                  התחל לכתוב את הרשומה הראשונה שלך
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  רשומה ראשונה
                </Button>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id} className="p-6" dir="rtl">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {entry.title && (
                          <h3 className="text-xl font-bold mb-2">
                            {entry.title}
                          </h3>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(entry.created_at), "d MMMM yyyy, HH:mm", {
                              locale: he,
                            })}
                          </div>
                          {entry.mood && (
                            <div className="flex items-center gap-1">
                              {getMoodIcon(entry.mood)}
                              <span>{getMoodText(entry.mood)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry.mutate(entry.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </div>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {entry.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Journal;
