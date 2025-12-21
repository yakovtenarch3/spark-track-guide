import { useState, useRef, useEffect } from "react";
import { useAlarms, Alarm } from "@/hooks/useAlarms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  AlarmClock,
  Plus,
  Trash2,
  Edit,
  Music,
  Upload,
  Clock,
  TimerReset,
  Volume2,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { value: 0, label: "א'" },
  { value: 1, label: "ב'" },
  { value: 2, label: "ג'" },
  { value: 3, label: "ד'" },
  { value: 4, label: "ה'" },
  { value: 5, label: "ו'" },
  { value: 6, label: "ש'" },
];

const DEFAULT_RINGTONES = [
  { name: "ברירת מחדל", url: null },
  { name: "צלצול קלאסי", url: "/sounds/classic.mp3" },
  { name: "ציוץ ציפורים", url: "/sounds/birds.mp3" },
  { name: "גלים", url: "/sounds/waves.mp3" },
];

export const AlarmManager = () => {
  const {
    alarms,
    isLoading,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    uploadRingtone,
  } = useAlarms();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [snoozedAlarms, setSnoozedAlarms] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName] = useState("שעון מעורר");
  const [time, setTime] = useState("06:00");
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeMinutes, setSnoozeMinutes] = useState(5);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [ringtoneName, setRingtoneName] = useState("ברירת מחדל");
  const [ringtoneUrl, setRingtoneUrl] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAlarm) {
      setName(editingAlarm.name);
      setTime(editingAlarm.time.slice(0, 5));
      setSnoozeEnabled(editingAlarm.snooze_enabled);
      setSnoozeMinutes(editingAlarm.snooze_minutes);
      setSelectedDays(editingAlarm.days_of_week || [0, 1, 2, 3, 4, 5, 6]);
      setRingtoneName(editingAlarm.ringtone_name || "ברירת מחדל");
      setRingtoneUrl(editingAlarm.ringtone_url);
    } else {
      resetForm();
    }
  }, [editingAlarm]);

  const resetForm = () => {
    setName("שעון מעורר");
    setTime("06:00");
    setSnoozeEnabled(true);
    setSnoozeMinutes(5);
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setRingtoneName("ברירת מחדל");
    setRingtoneUrl(null);
    stopPreview();
  };

  const handleOpenDialog = (alarm?: Alarm) => {
    if (alarm) {
      setEditingAlarm(alarm);
    } else {
      setEditingAlarm(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const alarmData = {
      name,
      time: `${time}:00`,
      snooze_enabled: snoozeEnabled,
      snooze_minutes: snoozeMinutes,
      days_of_week: selectedDays,
      ringtone_name: ringtoneName,
      ringtone_url: ringtoneUrl,
    };

    if (editingAlarm) {
      await updateAlarm.mutateAsync({ id: editingAlarm.id, ...alarmData });
    } else {
      await createAlarm.mutateAsync(alarmData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteAlarm.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("נא לבחור קובץ אודיו בלבד");
      return;
    }

    const result = await uploadRingtone(file);
    if (result) {
      setRingtoneUrl(result.url);
      setRingtoneName(result.name);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSnooze = (alarmId: string, minutes: number) => {
    setSnoozedAlarms((prev) => new Set(prev).add(alarmId));
    toast.success(`נדחה ב-${minutes} דקות`);

    setTimeout(() => {
      setSnoozedAlarms((prev) => {
        const next = new Set(prev);
        next.delete(alarmId);
        return next;
      });
      toast.info("השעון המעורר צלצל שוב!");
    }, minutes * 60 * 1000);
  };

  const previewRingtone = (url: string | null) => {
    stopPreview();
    if (!url) {
      toast.info("אין תצוגה מקדימה לרינגטון ברירת מחדל");
      return;
    }

    const audio = new Audio(url);
    audio.play().catch(() => toast.error("לא ניתן להשמיע את הרינגטון"));
    setPreviewAudio(audio);
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setPreviewAudio(null);
    };
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    setIsPlaying(false);
    setPreviewAudio(null);
  };

  const getDaysLabel = (days: number[]) => {
    if (days.length === 7) return "כל יום";
    if (days.length === 0) return "לא פעיל";
    if (
      days.length === 5 &&
      !days.includes(5) &&
      !days.includes(6)
    )
      return "ימי חול";
    if (days.length === 2 && days.includes(5) && days.includes(6))
      return "סוף שבוע";

    return days
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
      .join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlarmClock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <CardTitle className="text-lg sm:text-xl">שעונים מעוררים</CardTitle>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => handleOpenDialog()}
                  className="gap-1 h-8 sm:h-9"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">הוסף שעון</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>
                    {editingAlarm ? "ערוך שעון מעורר" : "שעון מעורר חדש"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label>שם</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="שם השעון"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <Label>שעה</Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="text-2xl h-14 text-center"
                    />
                  </div>

                  {/* Days of week */}
                  <div className="space-y-2">
                    <Label>ימים</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={selectedDays.includes(day.value) ? "default" : "outline"}
                          onClick={() => toggleDay(day.value)}
                          className="w-9 h-9 p-0"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Snooze */}
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TimerReset className="w-4 h-4 text-muted-foreground" />
                        <Label>נודניק (סנוז)</Label>
                      </div>
                      <Switch
                        checked={snoozeEnabled}
                        onCheckedChange={setSnoozeEnabled}
                      />
                    </div>
                    {snoozeEnabled && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">דקות:</Label>
                        <select
                          value={snoozeMinutes}
                          onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value={1}>1</option>
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Ringtone */}
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <Label>רינגטון</Label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_RINGTONES.map((r) => (
                          <Button
                            key={r.name}
                            type="button"
                            size="sm"
                            variant={ringtoneName === r.name ? "default" : "outline"}
                            onClick={() => {
                              setRingtoneName(r.name);
                              setRingtoneUrl(r.url);
                            }}
                            className="text-xs"
                          >
                            {r.name}
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          העלה רינגטון
                        </Button>

                        {ringtoneUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              isPlaying ? stopPreview() : previewRingtone(ringtoneUrl)
                            }
                            className="gap-1"
                          >
                            {isPlaying ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                            {isPlaying ? "עצור" : "השמע"}
                          </Button>
                        )}
                      </div>

                      {ringtoneUrl && ringtoneName !== "ברירת מחדל" && (
                        <p className="text-xs text-muted-foreground truncate">
                          נבחר: {ringtoneName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                    <Button onClick={handleSave} className="flex-1">
                      שמור
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {alarms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlarmClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>אין שעונים מעוררים</p>
              <p className="text-sm">לחץ על "הוסף שעון" ליצירת שעון חדש</p>
            </div>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={cn(
                  "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
                  alarm.is_active
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-muted/40 opacity-60"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Switch
                    checked={alarm.is_active}
                    onCheckedChange={(checked) =>
                      toggleAlarm.mutate({ id: alarm.id, is_active: checked })
                    }
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold">
                        {alarm.time.slice(0, 5)}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {alarm.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getDaysLabel(alarm.days_of_week || [])}
                      </Badge>
                      {alarm.snooze_enabled && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <TimerReset className="w-3 h-3" />
                          {alarm.snooze_minutes}ד'
                        </Badge>
                      )}
                      {alarm.ringtone_name && alarm.ringtone_name !== "ברירת מחדל" && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Music className="w-3 h-3" />
                          {alarm.ringtone_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {alarm.snooze_enabled && alarm.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSnooze(alarm.id, alarm.snooze_minutes)}
                      className="h-8 w-8"
                      title="סנוז"
                    >
                      <TimerReset className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(alarm)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmId(alarm.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת שעון מעורר</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את השעון המעורר הזה?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
