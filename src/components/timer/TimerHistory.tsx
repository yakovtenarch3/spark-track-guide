import { useState, useMemo } from "react";
import {
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Search,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isToday, isYesterday, isSameWeek } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimerSession {
  id: string;
  topic_id: string | null;
  topic_name: string;
  title: string | null;
  notes: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}

interface TimerTopic {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TimerHistoryProps {
  sessions: TimerSession[];
  topics: TimerTopic[];
  formatTime: (seconds: number) => string;
  onDeleteSession: (id: string) => void;
}

export function TimerHistory({
  sessions,
  topics,
  formatTime,
  onDeleteSession,
}: TimerHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["today", "yesterday", "week"])
  );

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.topic_name.toLowerCase().includes(query) ||
          s.title?.toLowerCase().includes(query) ||
          s.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by topic
    if (selectedTopic !== "all") {
      result = result.filter((s) => s.topic_id === selectedTopic);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [sessions, searchQuery, selectedTopic, sortOrder]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: { label: string; sessions: TimerSession[] } } = {
      today: { label: "היום", sessions: [] },
      yesterday: { label: "אתמול", sessions: [] },
      week: { label: "השבוע", sessions: [] },
      older: { label: "קודם", sessions: [] },
    };

    filteredSessions.forEach((session) => {
      const date = new Date(session.created_at);
      if (isToday(date)) {
        groups.today.sessions.push(session);
      } else if (isYesterday(date)) {
        groups.yesterday.sessions.push(session);
      } else if (isSameWeek(date, new Date(), { weekStartsOn: 0 })) {
        groups.week.sessions.push(session);
      } else {
        groups.older.sessions.push(session);
      }
    });

    return groups;
  }, [filteredSessions]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const getTopicColor = (topicId: string | null) => {
    if (!topicId) return "#8B5CF6";
    const topic = topics.find((t) => t.id === topicId);
    return topic?.color || "#8B5CF6";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            היסטוריית מפגשים
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9"
              />
            </div>

            {/* Topic Filter */}
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="כל הנושאים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הנושאים</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                      {topic.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="h-9"
            >
              {sortOrder === "desc" ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">אין מפגשים להצגה</p>
            <p className="text-sm">
              {searchQuery || selectedTopic !== "all"
                ? "נסה לשנות את הסינון"
                : "התחל טיימר כדי לתעד זמן"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="divide-y divide-border">
              {Object.entries(groupedSessions).map(([key, group]) => {
                if (group.sessions.length === 0) return null;
                const isExpanded = expandedGroups.has(key);

                return (
                  <div key={key}>
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(key)}
                      className="w-full flex items-center justify-between px-6 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{group.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.sessions.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Sessions */}
                    {isExpanded && (
                      <div className="divide-y divide-border/50">
                        {group.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="px-6 py-4 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                {/* Topic Badge */}
                                <div
                                  className="p-2 rounded-lg shrink-0"
                                  style={{
                                    backgroundColor: `${getTopicColor(session.topic_id)}20`,
                                    borderColor: getTopicColor(session.topic_id),
                                    borderWidth: 1,
                                  }}
                                >
                                  <Clock
                                    className="h-4 w-4"
                                    style={{ color: getTopicColor(session.topic_id) }}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="shrink-0"
                                      style={{
                                        borderColor: getTopicColor(session.topic_id),
                                        color: getTopicColor(session.topic_id),
                                      }}
                                    >
                                      {session.topic_name}
                                    </Badge>
                                    {session.title && (
                                      <span className="font-medium truncate">
                                        {session.title}
                                      </span>
                                    )}
                                  </div>

                                  {session.notes && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {session.notes}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="font-mono font-medium text-foreground">
                                      {formatTime(session.duration_seconds)}
                                    </span>
                                    <span>
                                      {format(
                                        new Date(session.created_at),
                                        "HH:mm",
                                        { locale: he }
                                      )}
                                    </span>
                                    <span className="text-xs">
                                      {format(
                                        new Date(session.created_at),
                                        "dd/MM/yyyy",
                                        { locale: he }
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDeleteSession(session.id)}
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    מחק
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
