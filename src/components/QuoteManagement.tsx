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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Sparkles } from "lucide-react";
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
  const { quotes, isLoading, addQuote, updateQuote, deleteQuote } = useCustomQuotes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  
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
        ...formData,
      });
      setEditingQuote(null);
    } else {
      addQuote(formData);
    }
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

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">משפטי מוטיבציה מותאמים אישית</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingQuote(null);
              setFormData({ text: "", author: "", category: "success" });
            }}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף משפט
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
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
                <Button type="submit">
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
            <Card key={quote.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <blockquote className="text-base font-medium">
                      "{quote.text}"
                    </blockquote>
                    <p className="text-sm text-muted-foreground">— {quote.author}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {categories.find((c) => c.value === quote.category)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={quote.is_active}
                        onCheckedChange={() => handleToggleActive(quote.id, quote.is_active)}
                      />
                      <span className="text-xs text-muted-foreground">
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
                      onClick={() => deleteQuote(quote.id)}
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
    </div>
  );
};
