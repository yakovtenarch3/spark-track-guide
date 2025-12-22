import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  BookmarkCheck,
  MessageSquare, 
  Lightbulb, 
  HelpCircle,
  Sparkles,
  Heart,
  Trash2,
  Plus,
  Star,
  FileText,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Square,
  ZoomIn,
  Check,
  Type,
  Palette,
  RefreshCw
} from "lucide-react";
import { dailyCoachTips, type DailyTip } from "@/data/dailyCoachTips";
import { useBookReader, type BookNote } from "@/hooks/useBookReader";
import { BookTableOfContents } from "@/components/book/BookTableOfContents";
import { UserBooksSection } from "@/components/book/UserBooksSection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearCacheAndRefresh } from "@/utils/notificationScheduler";

type FrameSize = 'compact' | 'normal' | 'wide' | 'fullscreen';
type FrameStyle = 'gold' | 'darkGold' | 'silver' | 'bronze' | 'minimal';

const FONT_OPTIONS = [
  { value: "system-ui, sans-serif", label: "מערכת" },
  { value: "'David Libre', serif", label: "דוד" },
  { value: "'Frank Ruhl Libre', serif", label: "פרנק רוהל" },
  { value: "'Heebo', sans-serif", label: "היבו" },
  { value: "'Rubik', sans-serif", label: "רוביק" },
  { value: "'Assistant', sans-serif", label: "אסיסטנט" },
  { value: "'Alef', sans-serif", label: "אלף" },
  { value: "'Miriam Libre', sans-serif", label: "מרים" },
];

const FRAME_STYLES = [
  {
    value: "gold" as FrameStyle,
    label: "זהב",
    borderColor: "hsl(var(--frame-gold))",
    shadowColor: "hsl(var(--frame-gold) / 0.28)",
  },
  {
    value: "darkGold" as FrameStyle,
    label: "זהב כהה",
    borderColor: "hsl(var(--frame-gold-dark))",
    shadowColor: "hsl(var(--frame-gold-dark) / 0.28)",
  },
  {
    value: "silver" as FrameStyle,
    label: "כסף",
    borderColor: "hsl(var(--frame-silver))",
    shadowColor: "hsl(var(--frame-silver) / 0.28)",
  },
  {
    value: "bronze" as FrameStyle,
    label: "ברונזה",
    borderColor: "hsl(var(--frame-bronze))",
    shadowColor: "hsl(var(--frame-bronze) / 0.28)",
  },
  {
    value: "minimal" as FrameStyle,
    label: "מינימלי",
    borderColor: "hsl(var(--border))",
    shadowColor: "transparent",
  },
];

export const BookReader = () => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<BookNote['note_type']>('note');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("read");
  
  // Display preferences - initialize with defaults, load from localStorage in useEffect
  const [frameSize, setFrameSize] = useState<FrameSize>('normal');
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('gold');
  const [fontFamily, setFontFamily] = useState("system-ui, sans-serif");
  const [zoom, setZoom] = useState(100);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load saved preferences from localStorage on mount (client-side only)
  useEffect(() => {
    const savedFrameSize = localStorage.getItem("book-reader-frame-size");
    const savedFrameStyle = localStorage.getItem("book-reader-frame-style");
    const savedFont = localStorage.getItem("book-reader-font");
    const savedZoom = localStorage.getItem("book-reader-zoom");

    if (savedFrameSize) setFrameSize(savedFrameSize as FrameSize);
    if (savedFrameStyle) setFrameStyle(savedFrameStyle as FrameStyle);
    if (savedFont) setFontFamily(savedFont);
    if (savedZoom) setZoom(parseInt(savedZoom));
    
    setPrefsLoaded(true);
  }, []);

  // Save preferences to localStorage (only after initial load)
  useEffect(() => {
    if (prefsLoaded) localStorage.setItem("book-reader-frame-size", frameSize);
  }, [frameSize, prefsLoaded]);

  useEffect(() => {
    if (prefsLoaded) localStorage.setItem("book-reader-frame-style", frameStyle);
  }, [frameStyle, prefsLoaded]);

  useEffect(() => {
    if (prefsLoaded) localStorage.setItem("book-reader-font", fontFamily);
  }, [fontFamily, prefsLoaded]);

  useEffect(() => {
    if (prefsLoaded) localStorage.setItem("book-reader-zoom", zoom.toString());
  }, [zoom, prefsLoaded]);

  // Debug: verify state changes are happening
  useEffect(() => {
    console.log("[BookReader] display prefs changed", {
      frameSize,
      frameStyle,
      fontFamily,
      zoom,
    });
  }, [frameSize, frameStyle, fontFamily, zoom]);

  const frameSizeLabels: Record<FrameSize, string> = {
    compact: "קומפקטי",
    normal: "רגיל",
    wide: "רחב",
    fullscreen: "מסך מלא",
  };

  const currentFrameStyle = FRAME_STYLES.find((s) => s.value === frameStyle) ?? FRAME_STYLES[0];
  const currentFont = FONT_OPTIONS.find((f) => f.value === fontFamily) ?? FONT_OPTIONS[0];

  const debugToast = (title: string, value: string) => {
    console.log(`[BookReader] ${title}:`, value);
    toast(`${title}: ${value}`);
  };

  const handleSetFrameSize = (value: FrameSize) => {
    setFrameSize(value);
    debugToast("גודל מסגרת", frameSizeLabels[value]);
  };

  const handleSetFrameStyle = (value: FrameStyle) => {
    setFrameStyle(value);
    const label = (FRAME_STYLES.find((s) => s.value === value)?.label) ?? value;
    debugToast("סגנון מסגרת", label);
  };

  const handleSetFontFamily = (value: string) => {
    setFontFamily(value);
    const label = (FONT_OPTIONS.find((f) => f.value === value)?.label) ?? value;
    debugToast("גופן", label);
  };

  const handleSetZoom = (value: number) => {
    setZoom(value);
    debugToast("זום", `${value}%`);
  };

  // Frame size configurations
  const getFrameStyles = () => {
    const currentStyle = FRAME_STYLES.find((s) => s.value === frameStyle) || FRAME_STYLES[0];

    let maxWidth = "700px";
    switch (frameSize) {
      case "compact":
        maxWidth = "500px";
        break;
      case "normal":
        maxWidth = "700px";
        break;
      case "wide":
        maxWidth = "900px";
        break;
      case "fullscreen":
        maxWidth = "100%";
        break;
    }

    const boxShadow =
      currentStyle.shadowColor === "transparent" ? "none" : `0 0 20px ${currentStyle.shadowColor}`;

    return {
      maxWidth,
      margin: frameSize === "fullscreen" ? "0" : "0 auto",
      borderColor: currentStyle.borderColor,
      boxShadow,
      fontFamily,
    };
  };
  
  const { 
    progress, 
    notes, 
    bookmarks, 
    updateProgress, 
    addNote, 
    toggleFavorite, 
    deleteNote,
    addBookmark,
    deleteBookmark 
  } = useBookReader();

  const currentTip = dailyCoachTips[currentTipIndex];
  const totalTips = dailyCoachTips.length;

  // Restore last read position on mount
  useEffect(() => {
    if (progress?.current_tip) {
      const tipIndex = dailyCoachTips.findIndex(t => t.id === progress.current_tip);
      if (tipIndex !== -1) {
        setCurrentTipIndex(tipIndex);
      }
    }
  }, [progress]);

  const goToTip = (index: number) => {
    if (index >= 0 && index < totalTips) {
      setCurrentTipIndex(index);
      updateProgress.mutate({ tipId: dailyCoachTips[index].id });
    }
  };

  const nextTip = () => goToTip(currentTipIndex + 1);
  const prevTip = () => goToTip(currentTipIndex - 1);

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("נא להזין תוכן להערה");
      return;
    }
    addNote.mutate(
      { tipId: currentTip.id, noteText: newNote, noteType },
      {
        onSuccess: () => {
          toast.success("ההערה נשמרה!");
          setNewNote("");
          setShowNoteInput(false);
        },
      }
    );
  };

  const handleAddBookmark = () => {
    const isBookmarked = bookmarks.some(b => b.tip_id === currentTip.id);
    if (isBookmarked) {
      const bookmark = bookmarks.find(b => b.tip_id === currentTip.id);
      if (bookmark) {
        deleteBookmark.mutate({ bookmarkId: bookmark.id }, {
          onSuccess: () => toast.success("הסימנייה הוסרה"),
        });
      }
    } else {
      addBookmark.mutate(
        { tipId: currentTip.id, title: currentTip.title },
        { onSuccess: () => toast.success("סימנייה נוספה!") }
      );
    }
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-book-tip', {
        body: { tip: currentTip }
      });

      if (error) throw error;

      addNote.mutate(
        { tipId: currentTip.id, noteText: data.analysis, noteType: 'ai_analysis' },
        {
          onSuccess: () => {
            toast.success("ניתוח AI נוסף!");
            setActiveTab("notes");
          },
        }
      );
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error("שגיאה בניתוח AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isCurrentBookmarked = bookmarks.some(b => b.tip_id === currentTip.id);
  const currentTipNotes = notes.filter(n => n.tip_id === currentTip.id);
  const favoriteNotes = notes.filter(n => n.is_favorite);

  const noteTypeIcons = {
    note: <MessageSquare className="w-4 h-4" />,
    question: <HelpCircle className="w-4 h-4" />,
    insight: <Lightbulb className="w-4 h-4" />,
    ai_analysis: <Sparkles className="w-4 h-4" />,
  };

  const noteTypeLabels = {
    note: "הערה",
    question: "שאלה",
    insight: "תובנה",
    ai_analysis: "ניתוח AI",
  };

  const noteTypeColors = {
    note: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    question: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    insight: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    ai_analysis: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Debug Status Bar - shows current display values */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-muted/50 border border-border rounded-lg p-2 text-xs text-muted-foreground flex flex-wrap gap-4 justify-end">
          <span>מסגרת: <strong className="text-foreground">{frameSizeLabels[frameSize]}</strong></span>
          <span>סגנון: <strong className="text-foreground">{currentFrameStyle.label}</strong></span>
          <span>גופן: <strong className="text-foreground">{currentFont.label}</strong></span>
          <span>זום: <strong className="text-foreground">{zoom}%</strong></span>
          <span>maxWidth: <strong className="text-foreground">{getFrameStyles().maxWidth}</strong></span>
        </div>
      )}

      {/* Header - RTL aligned */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-foreground">אומר ועושה</h1>
            <p className="text-sm text-muted-foreground">ספר לטיפול עצמי בנטייה לדחות דברים</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-row-reverse">
          {/* Display Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover border border-border z-50 text-right">
              <DropdownMenuLabel className="text-right">גודל מסגרת</DropdownMenuLabel>
              {([
                { value: 'compact' as FrameSize, label: 'קומפקטי', icon: Minimize2 },
                { value: 'normal' as FrameSize, label: 'רגיל', icon: Square },
                { value: 'wide' as FrameSize, label: 'רחב', icon: Maximize2 },
                { value: 'fullscreen' as FrameSize, label: 'מסך מלא', icon: Maximize2 },
              ]).map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => handleSetFrameSize(value)}
                  className="gap-2 cursor-pointer flex-row-reverse justify-end"
                >
                  {frameSize === value && <Check className="w-4 h-4 text-primary" />}
                  <span>{label}</span>
                  <Icon className="w-4 h-4" />
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2 flex-row-reverse justify-end">
                <span>סגנון מסגרת</span>
                <Palette className="w-4 h-4" />
              </DropdownMenuLabel>
              {FRAME_STYLES.map(({ value, label, borderColor }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => handleSetFrameStyle(value)}
                  className="gap-2 cursor-pointer flex-row-reverse justify-end"
                >
                  {frameStyle === value && <Check className="w-4 h-4 text-primary" />}
                  <span>{label}</span>
                  <div className="w-4 h-4 rounded border-2" style={{ borderColor }} />
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2 flex-row-reverse justify-end">
                <span>גופן</span>
                <Type className="w-4 h-4" />
              </DropdownMenuLabel>
              {FONT_OPTIONS.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => handleSetFontFamily(value)}
                  className="gap-2 cursor-pointer flex-row-reverse justify-end"
                  style={{ fontFamily: value }}
                >
                  {fontFamily === value && <Check className="w-4 h-4 text-primary" />}
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-right">זום</DropdownMenuLabel>
              {[75, 100, 125, 150].map((z) => (
                <DropdownMenuItem
                  key={z}
                  onSelect={() => handleSetZoom(z)}
                  className="gap-2 cursor-pointer flex-row-reverse justify-end"
                >
                  {zoom === z && <Check className="w-4 h-4 text-primary" />}
                  <span>{z}%</span>
                  <ZoomIn className="w-4 h-4" />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Cache Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              toast.info("מנקה מטמון וטוען מחדש...");
              clearCacheAndRefresh();
            }}
            title="נקה מטמון וטען מחדש"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Badge variant="outline" className="text-sm">
            {currentTipIndex + 1} / {totalTips}
          </Badge>
          
          <Badge variant="secondary" className="hidden lg:inline-flex text-xs">
            {frameSizeLabels[frameSize]} · {currentFrameStyle.label} · {currentFont.label}
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="read" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">קריאה</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">הערות</span>
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-2">
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">סימניות</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">מועדפים</span>
          </TabsTrigger>
          <TabsTrigger value="my-books" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">הספרים שלי</span>
          </TabsTrigger>
        </TabsList>

        {/* Reading Tab */}
        <TabsContent value="read" className="space-y-4">
          <div 
            className="mx-auto transition-all duration-300"
            style={{ maxWidth: getFrameStyles().maxWidth, margin: getFrameStyles().margin }}
          >
            <Card 
              className="p-6 rounded-xl transition-all duration-300"
              style={{ 
                fontSize: `${zoom}%`,
                fontFamily: getFrameStyles().fontFamily,
                border: `2px solid ${getFrameStyles().borderColor}`,
                boxShadow: getFrameStyles().boxShadow,
              }}
            >
            {/* Chapter Header */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">{currentTip.source}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddBookmark}
                className={isCurrentBookmarked ? "text-primary" : "text-muted-foreground"}
              >
                {isCurrentBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground mb-4">{currentTip.title}</h2>

            {/* Tip Content */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-foreground leading-relaxed">{currentTip.tip}</p>
            </div>

            {/* Task */}
            <div className="bg-primary/10 rounded-lg p-4 border-r-4 border-primary">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">משימה לתרגול:</span>
              </div>
              <p className="text-foreground">{currentTip.task}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevTip}
                disabled={currentTipIndex === 0}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  הוסף הערה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAnalyzing ? "מנתח..." : "ניתוח AI"}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={nextTip}
                disabled={currentTipIndex === totalTips - 1}
                className="gap-2"
              >
                הבא
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            </Card>
          </div>

          {/* Add Note Input */}
          {showNoteInput && (
            <Card className="p-4 royal-card">
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {(['note', 'question', 'insight'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={noteType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNoteType(type)}
                      className="gap-2"
                    >
                      {noteTypeIcons[type]}
                      {noteTypeLabels[type]}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="כתוב את ההערה שלך..."
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNoteInput(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleAddNote}>
                    שמור הערה
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Current Tip Notes */}
          {currentTipNotes.length > 0 && (
            <Card className="p-4 royal-card">
              <h3 className="font-medium mb-3">הערות לפרק זה ({currentTipNotes.length})</h3>
              <div className="space-y-3">
                {currentTipNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onToggleFavorite={() => toggleFavorite.mutate({ noteId: note.id, isFavorite: !note.is_favorite })}
                    onDelete={() => deleteNote.mutate({ noteId: note.id })}
                    noteTypeIcons={noteTypeIcons}
                    noteTypeLabels={noteTypeLabels}
                    noteTypeColors={noteTypeColors}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Enhanced Table of Contents */}
          <BookTableOfContents
            currentTipIndex={currentTipIndex}
            notes={notes}
            bookmarks={bookmarks}
            lastReadTipId={progress?.current_tip ?? null}
            onGoToTip={goToTip}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="p-4 royal-card">
            <h3 className="font-medium mb-4">כל ההערות ({notes.length})</h3>
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                אין הערות עדיין. התחל לקרוא והוסף הערות!
              </p>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pl-2">
                  {notes.map((note) => {
                    const relatedTip = dailyCoachTips.find(t => t.id === note.tip_id);
                    return (
                      <NoteCard
                        key={note.id}
                        note={note}
                        tipTitle={relatedTip?.title}
                        onToggleFavorite={() => toggleFavorite.mutate({ noteId: note.id, isFavorite: !note.is_favorite })}
                        onDelete={() => deleteNote.mutate({ noteId: note.id })}
                        onGoToTip={relatedTip ? () => {
                          const index = dailyCoachTips.findIndex(t => t.id === note.tip_id);
                          if (index !== -1) {
                            goToTip(index);
                            setActiveTab("read");
                          }
                        } : undefined}
                        noteTypeIcons={noteTypeIcons}
                        noteTypeLabels={noteTypeLabels}
                        noteTypeColors={noteTypeColors}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-4">
          <Card className="p-4 royal-card">
            <h3 className="font-medium mb-4">סימניות ({bookmarks.length})</h3>
            {bookmarks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                אין סימניות עדיין. לחץ על אייקון הסימנייה בזמן קריאה!
              </p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bookmark) => {
                  const tipIndex = dailyCoachTips.findIndex(t => t.id === bookmark.tip_id);
                  return (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <button
                        onClick={() => {
                          if (tipIndex !== -1) {
                            goToTip(tipIndex);
                            setActiveTab("read");
                          }
                        }}
                        className="flex items-center gap-2 text-right"
                      >
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                        <span>{bookmark.title}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteBookmark.mutate({ bookmarkId: bookmark.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <Card className="p-4 royal-card">
            <h3 className="font-medium mb-4">הערות מועדפות ({favoriteNotes.length})</h3>
            {favoriteNotes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                אין הערות מועדפות. סמן הערות כמועדפות בעזרת אייקון הלב!
              </p>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pl-2">
                  {favoriteNotes.map((note) => {
                    const relatedTip = dailyCoachTips.find(t => t.id === note.tip_id);
                    return (
                      <NoteCard
                        key={note.id}
                        note={note}
                        tipTitle={relatedTip?.title}
                        onToggleFavorite={() => toggleFavorite.mutate({ noteId: note.id, isFavorite: !note.is_favorite })}
                        onDelete={() => deleteNote.mutate({ noteId: note.id })}
                        onGoToTip={relatedTip ? () => {
                          const index = dailyCoachTips.findIndex(t => t.id === note.tip_id);
                          if (index !== -1) {
                            goToTip(index);
                            setActiveTab("read");
                          }
                        } : undefined}
                        noteTypeIcons={noteTypeIcons}
                        noteTypeLabels={noteTypeLabels}
                        noteTypeColors={noteTypeColors}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        {/* My Books Tab (PDF Upload & View) */}
        <TabsContent value="my-books" className="space-y-4">
          <UserBooksSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Note Card Component
interface NoteCardProps {
  note: BookNote;
  tipTitle?: string;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onGoToTip?: () => void;
  noteTypeIcons: Record<string, React.ReactNode>;
  noteTypeLabels: Record<string, string>;
  noteTypeColors: Record<string, string>;
}

const NoteCard = ({ 
  note, 
  tipTitle, 
  onToggleFavorite, 
  onDelete, 
  onGoToTip,
  noteTypeIcons,
  noteTypeLabels,
  noteTypeColors
}: NoteCardProps) => (
  <div className="p-3 rounded-lg border bg-card">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={noteTypeColors[note.note_type]}>
          {noteTypeIcons[note.note_type]}
          <span className="mr-1">{noteTypeLabels[note.note_type]}</span>
        </Badge>
        {tipTitle && onGoToTip && (
          <button
            onClick={onGoToTip}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {tipTitle}
          </button>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${note.is_favorite ? 'text-red-500' : 'text-muted-foreground'}`}
          onClick={onToggleFavorite}
        >
          <Heart className={`w-4 h-4 ${note.is_favorite ? 'fill-current' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
    <p className="text-sm text-foreground whitespace-pre-wrap">{note.note_text}</p>
    <p className="text-xs text-muted-foreground mt-2">
      {new Date(note.created_at).toLocaleDateString('he-IL')}
    </p>
  </div>
);
