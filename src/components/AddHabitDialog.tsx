import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ColorPicker";
import { CATEGORIES } from "@/components/CategoryFilter";
import { toast } from "sonner";

interface AddHabitDialogProps {
  children: React.ReactNode;
  onAddHabit: (
    title: string,
    description: string,
    category: string,
    color: string,
    preferredTime?: string
  ) => void;
}

export const AddHabitDialog = ({ children, onAddHabit }: AddHabitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [color, setColor] = useState("#4A90E2");
  const [preferredTime, setPreferredTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("שגיאה", {
        description: "נא למלא את שם ההרגל",
      });
      return;
    }

    onAddHabit(
      title.trim(),
      description.trim(),
      category,
      color,
      preferredTime || undefined
    );

    // Reset and close
    setTitle("");
    setDescription("");
    setCategory("other");
    setColor("#4A90E2");
    setPreferredTime("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">הוסף הרגל חדש</DialogTitle>
          <DialogDescription>
            צור הרגל חדש למעקב יומי. מלא את הפרטים למטה.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base">
              שם ההרגל *
            </Label>
            <Input
              id="title"
              placeholder="לדוגמה: קריאה 15 דקות"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base h-12"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">
              תיאור (אופציונלי)
            </Label>
            <Textarea
              id="description"
              placeholder="תאר את ההרגל בקצרה..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-base min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-base">
              קטגוריה
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ColorPicker selectedColor={color} onColorChange={setColor} />

          <div className="space-y-2">
            <Label htmlFor="time" className="text-base">
              שעה מועדפת (אופציונלי)
            </Label>
            <Input
              id="time"
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="text-base h-12"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base"
            >
              הוסף הרגל
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-12 text-base"
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
