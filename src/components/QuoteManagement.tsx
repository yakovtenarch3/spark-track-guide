import { useState, useRef, useMemo } from "react";
import { useCustomQuotes } from "@/hooks/useCustomQuotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, Edit, Trash2, Sparkles, Star, Download, Upload, FileJson, FileText, 
  LayoutGrid, LayoutList, Table2, Search, CheckSquare, Square, X, Filter
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const categories = [
  { value: "success", label: "הצלחה" },
  { value: "persistence", label: "התמדה" },
  { value: "growth", label: "צמיחה" },
  { value: "strength", label: "כוח" },
  { value: "action", label: "פעולה" },
];

type ViewMode = "list" | "compact" | "table";

export const QuoteManagement = () => {
  const { quotes, isLoading, addQuote, updateQuote, deleteQuote, toggleFavorite, isUpdating } = useCustomQuotes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    text: "",
    author: "",
    category: "success",
  });

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = searchQuery === "" || 
        quote.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || quote.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [quotes, searchQuery, categoryFilter]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredQuotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuotes.map(q => q.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions
  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteQuote(id));
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    toast.success(`נמחקו ${selectedIds.size} משפטים`);
  };

  const handleBulkToggleActive = (active: boolean) => {
    selectedIds.forEach(id => updateQuote({ id, is_active: active }));
    toast.success(`עודכנו ${selectedIds.size} משפטים`);
  };

  const handleBulkToggleFavorite = (favorite: boolean) => {
    selectedIds.forEach(id => {
      const quote = quotes.find(q => q.id === id);
      if (quote && quote.is_favorite !== favorite) {
        toggleFavorite(id, quote.is_favorite);
      }
    });
    toast.success(`עודכנו ${selectedIds.size} משפטים`);
  };

  // Export quotes to JSON file
  const handleExportJSON = () => {
    const quotesToExport = selectedIds.size > 0 
      ? quotes.filter(q => selectedIds.has(q.id))
      : quotes;
      
    if (quotesToExport.length === 0) {
      toast.error("אין משפטים לייצוא");
      return;
    }

    const exportData = quotesToExport.map((q) => ({
      text: q.text,
      author: q.author,
      category: q.category,
      is_active: q.is_active,
      is_favorite: q.is_favorite,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motivational-quotes-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`יוצאו ${quotesToExport.length} משפטים בהצלחה!`);
  };

  // Export quotes to TXT file
  const handleExportTXT = () => {
    const quotesToExport = selectedIds.size > 0 
      ? quotes.filter(q => selectedIds.has(q.id))
      : quotes;
      
    if (quotesToExport.length === 0) {
      toast.error("אין משפטים לייצוא");
      return;
    }

    const txtContent = quotesToExport
      .map((q) => `"${q.text}" - ${q.author} [${q.category}]`)
      .join("\n\n");

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motivational-quotes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`יוצאו ${quotesToExport.length} משפטים בהצלחה!`);
  };

  // Parse TXT content
  const parseTxtContent = (content: string): any[] => {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    const parsed: any[] = [];

    for (const line of lines) {
      const fullMatch = line.match(/^"(.+?)"\s*-\s*(.+?)\s*\[(\w+)\]$/);
      if (fullMatch) {
        parsed.push({
          text: fullMatch[1],
          author: fullMatch[2].trim(),
          category: fullMatch[3],
        });
        continue;
      }

      const noCategory = line.match(/^"(.+?)"\s*-\s*(.+)$/);
      if (noCategory) {
        parsed.push({
          text: noCategory[1],
          author: noCategory[2].trim(),
          category: "success",
        });
        continue;
      }

      if (line.trim().length > 5) {
        parsed.push({
          text: line.trim().replace(/^"|"$/g, ""),
          author: "לא ידוע",
          category: "success",
        });
      }
    }

    return parsed;
  };

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith(".json");
    const isTxt = file.name.endsWith(".txt");

    if (!isJson && !isTxt) {
      toast.error("יש לבחור קובץ JSON או TXT");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        if (isJson) {
          const data = JSON.parse(content);
          if (!Array.isArray(data)) {
            toast.error("פורמט קובץ לא תקין");
            return;
          }
          const validQuotes = data.filter(
            (item) => typeof item.text === "string" && typeof item.author === "string"
          );
          if (validQuotes.length === 0) {
            toast.error("לא נמצאו משפטים תקינים בקובץ");
            return;
          }
          setImportPreview(validQuotes);
          setImportDialogOpen(true);
        } else {
          const parsed = parseTxtContent(content);
          if (parsed.length === 0) {
            toast.error("לא נמצאו משפטים תקינים בקובץ");
            return;
          }
          setImportPreview(parsed);
          setImportDialogOpen(true);
        }
      } catch {
        toast.error("שגיאה בקריאת הקובץ");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Import quotes
  const handleImport = async () => {
    let successCount = 0;
    
    for (const quote of importPreview) {
      try {
        await addQuote({
          text: quote.text,
          author: quote.author,
          category: quote.category || "success",
        });
        successCount++;
      } catch (error) {
        console.error("Error importing quote:", error);
      }
    }

    setImportDialogOpen(false);
    setImportPreview([]);
    toast.success(`יובאו ${successCount} משפטים בהצלחה!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuote) {
      updateQuote({
        id: editingQuote.id,
        text: formData.text,
        author: formData.author,
        category: formData.category,
      });
    } else {
      addQuote(formData);
    }
    setEditingQuote(null);
    setFormData({ text: "", author: "", category: "success" });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (quote: any) => {
    setEditingQuote(quote);
    setFormData({
      text: quote.text,
      author: quote.author,
      category: quote.category,
    });
    setIsAddDialogOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateQuote({ id, is_active: !currentActive });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteQuote(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  // Render quote based on view mode
  const renderQuote = (quote: any) => {
    const isSelected = selectedIds.has(quote.id);
    
    if (viewMode === "compact") {
      return (
        <div
          key={quote.id}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-accent/50 ${
            isSelected ? "bg-primary/10 border-primary" : "bg-card"
          } ${quote.is_favorite ? "border-yellow-400/50" : ""}`}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleSelect(quote.id)}
          />
          <Star
            className={`w-4 h-4 shrink-0 cursor-pointer ${
              quote.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
            onClick={() => toggleFavorite(quote.id, quote.is_favorite)}
          />
          <span className="flex-1 text-sm truncate" title={quote.text}>
            "{quote.text}"
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">— {quote.author}</span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {categories.find((c) => c.value === quote.category)?.label}
          </Badge>
          <Switch
            checked={quote.is_active}
            onCheckedChange={() => handleToggleActive(quote.id, quote.is_active)}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(quote)}>
            <Edit className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirmId(quote.id)}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      );
    }

    if (viewMode === "table") {
      return (
        <tr key={quote.id} className={`border-b hover:bg-accent/50 ${isSelected ? "bg-primary/10" : ""}`}>
          <td className="p-2">
            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(quote.id)} />
          </td>
          <td className="p-2">
            <Star
              className={`w-4 h-4 cursor-pointer ${
                quote.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              }`}
              onClick={() => toggleFavorite(quote.id, quote.is_favorite)}
            />
          </td>
          <td className="p-2 max-w-[300px]">
            <span className="text-sm line-clamp-2">"{quote.text}"</span>
          </td>
          <td className="p-2 text-sm text-muted-foreground whitespace-nowrap">{quote.author}</td>
          <td className="p-2">
            <Badge variant="secondary" className="text-xs">
              {categories.find((c) => c.value === quote.category)?.label}
            </Badge>
          </td>
          <td className="p-2">
            <Switch
              checked={quote.is_active}
              onCheckedChange={() => handleToggleActive(quote.id, quote.is_active)}
            />
          </td>
          <td className="p-2">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(quote)}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirmId(quote.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    // Default list view
    return (
      <Card
        key={quote.id}
        className={`transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""} ${
          quote.is_favorite ? "ring-2 ring-yellow-400/50 bg-yellow-50/10" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelect(quote.id)}
              className="mt-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 mt-1"
              onClick={() => toggleFavorite(quote.id, quote.is_favorite)}
            >
              <Star className={`w-5 h-5 ${quote.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            </Button>
            <div className="flex-1 space-y-2 min-w-0">
              <blockquote className="text-base font-medium break-words">"{quote.text}"</blockquote>
              <p className="text-sm text-muted-foreground">— {quote.author}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {categories.find((c) => c.value === quote.category)?.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <Switch
                  checked={quote.is_active}
                  onCheckedChange={() => handleToggleActive(quote.id, quote.is_active)}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {quote.is_active ? "פעיל" : "לא פעיל"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(quote)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(quote.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">משפטי מוטיבציה</h3>
          <Badge variant="outline">{quotes.length}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1 gap-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
              title="תצוגת רשימה"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("compact")}
              title="תצוגה קומפקטית"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("table")}
              title="תצוגת טבלה"
            >
              <Table2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={quotes.length === 0}>
                <Download className="w-4 h-4 ml-2" />
                ייצוא {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileJson className="w-4 h-4 ml-2" />
                ייצוא JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportTXT}>
                <FileText className="w-4 h-4 ml-2" />
                ייצוא TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import Button */}
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 ml-2" />
            ייבוא
          </Button>
          <input ref={fileInputRef} type="file" accept=".json,.txt" onChange={handleFileSelect} className="hidden" />

          {/* Add Quote Dialog */}
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingQuote(null);
                setFormData({ text: "", author: "", category: "success" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingQuote(null);
                  setFormData({ text: "", author: "", category: "success" });
                }}
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף משפט
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingQuote ? "ערוך משפט מוטיבציה" : "הוסף משפט מוטיבציה חדש"}</DialogTitle>
                <DialogDescription>צור משפט מוטיבציה מותאם אישית שיופיע באפליקציה</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">טקסט המשפט</Label>
                  <Textarea
                    id="text"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="הכנס את משפט המוטיבציה..."
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">מחבר</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="שם המחבר"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">קטגוריה</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isUpdating}>
                    {editingQuote ? "עדכן" : "הוסף"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש משפטים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selection Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} נבחרו</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleActive(true)}>
            הפעל הכל
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleActive(false)}>
            השבת הכל
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleFavorite(true)}>
            <Star className="w-4 h-4 ml-1" />
            מועדפים
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 ml-1" />
            מחק נבחרים
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="w-4 h-4 ml-1" />
            בטל בחירה
          </Button>
        </div>
      )}

      {/* Select All */}
      {filteredQuotes.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === filteredQuotes.length && filteredQuotes.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            בחר הכל ({filteredQuotes.length})
          </span>
        </div>
      )}

      {/* Quotes Display */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {quotes.length === 0 ? (
              <>
                עדיין לא הוספת משפטי מוטיבציה מותאמים אישית.
                <br />
                לחץ על "הוסף משפט" כדי להתחיל!
              </>
            ) : (
              <>לא נמצאו משפטים התואמים לחיפוש</>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="max-h-[500px]">
            <table className="w-full" dir="rtl">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="border-b">
                  <th className="p-2 w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredQuotes.length}
                      onCheckedChange={selectAll}
                    />
                  </th>
                  <th className="p-2 w-10"></th>
                  <th className="p-2 text-right text-sm font-medium">משפט</th>
                  <th className="p-2 text-right text-sm font-medium">מחבר</th>
                  <th className="p-2 text-right text-sm font-medium">קטגוריה</th>
                  <th className="p-2 text-right text-sm font-medium">סטטוס</th>
                  <th className="p-2 w-20"></th>
                </tr>
              </thead>
              <tbody>{filteredQuotes.map(renderQuote)}</tbody>
            </table>
          </ScrollArea>
        </div>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className={viewMode === "compact" ? "space-y-2" : "space-y-3"}>
            {filteredQuotes.map(renderQuote)}
          </div>
        </ScrollArea>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו תמחק את המשפט לצמיתות. לא ניתן לבטל פעולה זו.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת {selectedIds.size} משפטים?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו תמחק את כל המשפטים שנבחרו לצמיתות. לא ניתן לבטל פעולה זו.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק {selectedIds.size} משפטים
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              תצוגה מקדימה לייבוא
            </DialogTitle>
            <DialogDescription>נמצאו {importPreview.length} משפטים לייבוא</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {importPreview.map((quote, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-3">
                    <blockquote className="text-sm font-medium mb-1">"{quote.text}"</blockquote>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>— {quote.author}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {categories.find((c) => c.value === quote.category)?.label || quote.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleImport}>
              <Upload className="w-4 h-4 ml-2" />
              ייבא {importPreview.length} משפטים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
