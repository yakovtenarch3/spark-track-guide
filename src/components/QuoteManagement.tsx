import { useState } from "react";
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
import { Plus, Edit, Trash2, Sparkles, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "success", label: "הצלחה" },
  { value: "persistence", label: "התמדה" },
  { value: "growth", label: "צמיחה" },
  { value: "strength", label: "כוח" },
  { value: "action", label: "פעולה" },
];

export const QuoteManagement = () => {
  const { quotes, isLoading, addQuote, updateQuote, deleteQuote, toggleFavorite, isUpdating } = useCustomQuotes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    text: "",
    author: "",
    category: "success",
  });

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">משפטי מוטיבציה מותאמים אישית</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingQuote(null);
            setFormData({ text: "", author: "", category: "success" });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingQuote(null);
              setFormData({ text: "", author: "", category: "success" });
            }}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף משפט
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? "ערוך משפט מוטיבציה" : "הוסף משפט מוטיבציה חדש"}
              </DialogTitle>
              <DialogDescription>
                צור משפט מוטיבציה מותאם אישית שיופיע באפליקציה
              </DialogDescription>
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
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
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

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            עדיין לא הוספת משפטי מוטיבציה מותאמים אישית.
            <br />
            לחץ על "הוסף משפט" כדי להתחיל!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <Card key={quote.id} className={`transition-all hover:shadow-md ${quote.is_favorite ? 'ring-2 ring-yellow-400/50 bg-yellow-50/10' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-1"
                    onClick={() => toggleFavorite(quote.id, quote.is_favorite)}
                    aria-label={quote.is_favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
                  >
                    <Star className={`w-5 h-5 ${quote.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </Button>
                  <div className="flex-1 space-y-2 min-w-0">
                    <blockquote className="text-base font-medium break-words">
                      "{quote.text}"
                    </blockquote>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(quote)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(quote.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המשפט לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
