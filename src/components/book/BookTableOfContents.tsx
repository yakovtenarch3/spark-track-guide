import { useMemo, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  List,
  Search,
  MessageSquare,
  Bookmark,
  Star,
  Sparkles,
  ArrowRight,
  X,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { dailyCoachTips } from "@/data/dailyCoachTips";
import type { BookNote, BookBookmark } from "@/hooks/useBookReader";

interface BookTableOfContentsProps {
  currentTipIndex: number;
  notes: BookNote[];
  bookmarks: BookBookmark[];
  lastReadTipId: number | null;
  onGoToTip: (index: number) => void;
}

type TipStats = { notes: number; favorites: number; ai: number };

function extractChapterNumber(source: string): number | null {
  const m = source.match(/פרק\s*(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export const BookTableOfContents = ({
  currentTipIndex,
  notes,
  bookmarks,
  lastReadTipId,
  onGoToTip,
}: BookTableOfContentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem("book-toc-pinned");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save pin state to localStorage
  useEffect(() => {
    localStorage.setItem("book-toc-pinned", JSON.stringify(isPinned));
  }, [isPinned]);

  // Auto-hide logic when not pinned
  useEffect(() => {
    if (isPinned) {
      setIsCollapsed(false);
      return;
    }

    // When not pinned, collapse after a delay when mouse leaves
    if (!isHovered) {
      timeoutRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, 2000); // 2 second delay before collapsing
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsCollapsed(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPinned, isHovered]);

  const idToIndex = useMemo(() => {
    const map = new Map<number, number>();
    dailyCoachTips.forEach((t, i) => map.set(t.id, i));
    return map;
  }, []);

  const bookmarkedTipIds = useMemo(() => new Set(bookmarks.map((b) => b.tip_id)), [bookmarks]);

  const notesCountByTip = useMemo(() => {
    const counts: Record<number, TipStats> = {};
    for (const note of notes) {
      if (!note.tip_id) continue;
      if (!counts[note.tip_id]) counts[note.tip_id] = { notes: 0, favorites: 0, ai: 0 };
      counts[note.tip_id].notes++;
      if (note.is_favorite) counts[note.tip_id].favorites++;
      if (note.note_type === "ai_analysis") counts[note.tip_id].ai++;
    }
    return counts;
  }, [notes]);

  const sources = useMemo(() => {
    // סדר יציב לפי הופעה ראשונה + פרק מספרי אם קיים
    const firstIndex = new Map<string, number>();
    dailyCoachTips.forEach((t, i) => {
      if (!firstIndex.has(t.source)) firstIndex.set(t.source, i);
    });

    const unique = Array.from(firstIndex.keys());

    return unique.sort((a, b) => {
      const aChap = extractChapterNumber(a);
      const bChap = extractChapterNumber(b);

      if (aChap !== null && bChap !== null) {
        if (aChap !== bChap) return aChap - bChap;
      } else if (aChap !== null) {
        return -1;
      } else if (bChap !== null) {
        return 1;
      }

      return (firstIndex.get(a) ?? 0) - (firstIndex.get(b) ?? 0);
    });
  }, []);

  const matchingTips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dailyCoachTips.filter((tip) => {
      const matchesSource = !selectedSource || tip.source === selectedSource;
      if (!matchesSource) return false;

      if (!q) return true;
      return (
        tip.title.toLowerCase().includes(q) ||
        tip.tip.toLowerCase().includes(q) ||
        tip.source.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedSource]);

  const groups = useMemo(() => {
    type Tip = (typeof dailyCoachTips)[number];
    const map = new Map<string, Tip[]>();

    for (const tip of matchingTips) {
      const arr = map.get(tip.source) ?? [];
      arr.push(tip);
      map.set(tip.source, arr);
    }

    const orderedSources = selectedSource ? [selectedSource] : sources;

    return orderedSources
      .map((source) => ({
        source,
        tips: map.get(source) ?? [],
      }))
      .filter((g) => g.tips.length > 0)
      .map((g) => ({
        ...g,
        tips: g.tips
          .slice()
          .sort((a, b) => (idToIndex.get(a.id) ?? 0) - (idToIndex.get(b.id) ?? 0)),
      }));
  }, [matchingTips, sources, selectedSource, idToIndex]);

  const lastReadTipIndex = lastReadTipId ? (idToIndex.get(lastReadTipId) ?? -1) : -1;
  const currentSource = dailyCoachTips[currentTipIndex]?.source;

  const accordionDefaultOpen = useMemo(() => {
    if (selectedSource) return [selectedSource];
    if (currentSource) return [currentSource];
    return [];
  }, [selectedSource, currentSource]);

  return (
    <Card 
      ref={containerRef}
      className={`p-4 royal-card transition-all duration-300 ${
        !isPinned && isCollapsed ? 'max-h-14 overflow-hidden' : ''
      }`} 
      dir="rtl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-row-reverse items-center justify-between gap-3 mb-3">
        <div className="flex flex-row-reverse items-center gap-2">
          <List className="w-4 h-4" />
          <h3 className="font-medium">תוכן עניינים</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse/Expand Button (visible when not pinned) */}
          {!isPinned && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          )}
          
          {/* Pin/Unpin Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPinned ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsPinned(!isPinned)}
                >
                  {isPinned ? (
                    <Pin className="w-4 h-4" />
                  ) : (
                    <PinOff className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPinned ? "בטל נעיצה (אוטו-הייד)" : "נעץ (תמיד פתוח)"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Badge variant="outline" className="text-xs">
            {dailyCoachTips.length} פרקים
          </Badge>
        </div>
      </div>

      {/* Quick Jump Button */}
      {lastReadTipIndex > 0 && lastReadTipIndex !== currentTipIndex && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-3 gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
          onClick={() => onGoToTip(lastReadTipIndex)}
        >
          <ArrowRight className="w-4 h-4" />
          המשך מאיפה שהפסקת (טיפ {lastReadTipIndex + 1})
        </Button>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חפש בתוכן..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 text-right"
          dir="rtl"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
            aria-label="נקה חיפוש"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Source Filter (Dropdown instead of many badges) */}
      <div className="mb-3">
        <div className="flex flex-row-reverse items-center justify-between gap-2 mb-2">
          <span className="text-xs text-muted-foreground">סינון לפי פרק:</span>
          <span className="text-xs text-muted-foreground">{matchingTips.length} תוצאות</span>
        </div>

        <Select
          value={selectedSource ?? "all"}
          onValueChange={(value) => setSelectedSource(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full bg-popover z-10">
            <SelectValue placeholder="בחר פרק" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">הכל</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-row-reverse flex-wrap gap-3 mb-3 text-xs text-muted-foreground border-t pt-2">
        <div className="flex items-center gap-1">
          <span>הערות</span>
          <MessageSquare className="w-3 h-3 text-info" />
        </div>
        <div className="flex items-center gap-1">
          <span>סימנייה</span>
          <Bookmark className="w-3 h-3 text-primary" />
        </div>
        <div className="flex items-center gap-1">
          <span>מועדף</span>
          <Star className="w-3 h-3 text-warning" />
        </div>
        <div className="flex items-center gap-1">
          <span>AI</span>
          <Sparkles className="w-3 h-3 text-success" />
        </div>
      </div>

      {/* Grouped List */}
      <ScrollArea className="h-72">
        <Accordion
          key={`${selectedSource ?? "all"}-${currentTipIndex}`}
          type="multiple"
          defaultValue={accordionDefaultOpen}
          className="w-full"
          dir="rtl"
        >
          {groups.map((group) => (
            <AccordionItem key={group.source} value={group.source} className="border-border/60">
              <AccordionTrigger className="flex flex-row-reverse items-center justify-between text-right">
                <div className="flex flex-row-reverse items-center gap-2 min-w-0">
                  <span className="truncate">{group.source}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.tips.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1">
                  {group.tips.map((tip) => {
                    const originalIndex = idToIndex.get(tip.id) ?? 0;
                    const tipStats = notesCountByTip[tip.id];
                    const isBookmarked = bookmarkedTipIds.has(tip.id);
                    const isActive = originalIndex === currentTipIndex;

                    return (
                      <button
                        key={tip.id}
                        onClick={() => onGoToTip(originalIndex)}
                        className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex flex-row-reverse items-start justify-between gap-2">
                          <div className="flex flex-row-reverse items-center gap-2 min-w-0">
                            <span className="text-sm truncate">{tip.title}</span>

                            {/* Stats */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {tipStats?.notes > 0 && (
                                <div
                                  className={`flex items-center gap-0.5 ${
                                    isActive ? "text-primary-foreground/80" : "text-info"
                                  }`}
                                >
                                  <span className="text-[10px]">{tipStats.notes}</span>
                                  <MessageSquare className="w-3 h-3" />
                                </div>
                              )}
                              {isBookmarked && (
                                <Bookmark
                                  className={`w-3 h-3 ${
                                    isActive ? "text-primary-foreground/80" : "text-primary"
                                  }`}
                                />
                              )}
                              {tipStats?.favorites > 0 && (
                                <Star
                                  className={`w-3 h-3 ${
                                    isActive ? "text-primary-foreground/80" : "text-warning"
                                  }`}
                                />
                              )}
                              {tipStats?.ai > 0 && (
                                <Sparkles
                                  className={`w-3 h-3 ${
                                    isActive ? "text-primary-foreground/80" : "text-success"
                                  }`}
                                />
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-xs flex-shrink-0 ${
                              isActive ? "opacity-80" : "opacity-70"
                            }`}
                          >
                            {originalIndex + 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          {groups.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">לא נמצאו תוצאות</p>
          )}
        </Accordion>
      </ScrollArea>
    </Card>
  );
};

