import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  List, 
  Search, 
  Filter, 
  MessageSquare, 
  Bookmark, 
  Star, 
  Sparkles,
  ArrowRight,
  X
} from "lucide-react";
import { dailyCoachTips, type DailyTip } from "@/data/dailyCoachTips";
import type { BookNote, BookBookmark } from "@/hooks/useBookReader";

interface BookTableOfContentsProps {
  currentTipIndex: number;
  notes: BookNote[];
  bookmarks: BookBookmark[];
  lastReadTipId: number | null;
  onGoToTip: (index: number) => void;
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

  // Get unique sources for filtering
  const sources = useMemo(() => {
    const sourceSet = new Set(dailyCoachTips.map(tip => tip.source));
    return Array.from(sourceSet);
  }, []);

  // Get notes count per tip
  const notesCountByTip = useMemo(() => {
    const counts: Record<number, { notes: number; favorites: number; ai: number }> = {};
    notes.forEach(note => {
      if (note.tip_id) {
        if (!counts[note.tip_id]) {
          counts[note.tip_id] = { notes: 0, favorites: 0, ai: 0 };
        }
        counts[note.tip_id].notes++;
        if (note.is_favorite) counts[note.tip_id].favorites++;
        if (note.note_type === 'ai_analysis') counts[note.tip_id].ai++;
      }
    });
    return counts;
  }, [notes]);

  // Get bookmarked tip IDs
  const bookmarkedTipIds = useMemo(() => {
    return new Set(bookmarks.map(b => b.tip_id));
  }, [bookmarks]);

  // Filter tips based on search and source
  const filteredTips = useMemo(() => {
    return dailyCoachTips.filter(tip => {
      const matchesSearch = !searchQuery || 
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.tip.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = !selectedSource || tip.source === selectedSource;
      return matchesSearch && matchesSource;
    });
  }, [searchQuery, selectedSource]);

  // Find last read tip index
  const lastReadTipIndex = lastReadTipId 
    ? dailyCoachTips.findIndex(t => t.id === lastReadTipId)
    : -1;

  return (
    <Card className="p-4 royal-card" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <List className="w-4 h-4" />
        <h3 className="font-medium">תוכן עניינים</h3>
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
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            className="absolute left-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Source Filter */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">סנן לפי מקור:</span>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          <Badge
            variant={!selectedSource ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedSource(null)}
          >
            הכל
          </Badge>
          {sources.map((source) => (
            <Badge
              key={source}
              variant={selectedSource === source ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedSource(source === selectedSource ? null : source)}
            >
              {source}
            </Badge>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground border-t pt-2 justify-end">
        <div className="flex items-center gap-1 flex-row-reverse">
          <MessageSquare className="w-3 h-3 text-blue-500" />
          <span>הערות</span>
        </div>
        <div className="flex items-center gap-1 flex-row-reverse">
          <Bookmark className="w-3 h-3 text-primary" />
          <span>סימנייה</span>
        </div>
        <div className="flex items-center gap-1 flex-row-reverse">
          <Star className="w-3 h-3 text-amber-500" />
          <span>מועדף</span>
        </div>
        <div className="flex items-center gap-1 flex-row-reverse">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>AI</span>
        </div>
      </div>

      {/* Tips List */}
      <ScrollArea className="h-64">
        <div className="space-y-1">
          {filteredTips.map((tip) => {
            const originalIndex = dailyCoachTips.findIndex(t => t.id === tip.id);
            const tipStats = notesCountByTip[tip.id];
            const isBookmarked = bookmarkedTipIds.has(tip.id);
            const isActive = originalIndex === currentTipIndex;

            return (
              <button
                key={tip.id}
                onClick={() => onGoToTip(originalIndex)}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm truncate">{tip.title}</span>
                    {/* Icons for notes/bookmarks */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {tipStats?.notes > 0 && (
                        <div className={`flex items-center ${isActive ? 'text-primary-foreground/80' : 'text-blue-500'}`}>
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-[10px]">{tipStats.notes}</span>
                        </div>
                      )}
                      {isBookmarked && (
                        <Bookmark className={`w-3 h-3 ${isActive ? 'text-primary-foreground/80' : 'text-primary'}`} />
                      )}
                      {tipStats?.favorites > 0 && (
                        <Star className={`w-3 h-3 ${isActive ? 'text-primary-foreground/80' : 'text-amber-500'}`} />
                      )}
                      {tipStats?.ai > 0 && (
                        <Sparkles className={`w-3 h-3 ${isActive ? 'text-primary-foreground/80' : 'text-emerald-500'}`} />
                      )}
                    </div>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${isActive ? 'opacity-80' : 'opacity-70'}`}>
                    {originalIndex + 1}
                  </span>
                </div>
              </button>
            );
          })}
          {filteredTips.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              לא נמצאו תוצאות
            </p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
