import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { habitTemplates, HabitTemplate } from "@/data/habitTemplates";
import { BookTemplate, Heart, Brain, Zap, Plus } from "lucide-react";
import { toast } from "sonner";

interface TemplateLibraryProps {
  onAddHabitFromTemplate: (template: HabitTemplate) => void;
}

export const TemplateLibrary = ({ onAddHabitFromTemplate }: TemplateLibraryProps) => {
  const [open, setOpen] = useState(false);

  const handleAddTemplate = (template: HabitTemplate) => {
    onAddHabitFromTemplate(template);
    toast.success(`הרגל "${template.title}" נוסף בהצלחה! 🎉`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health":
        return <Heart className="w-5 h-5" />;
      case "productivity":
        return <Zap className="w-5 h-5" />;
      case "learning":
        return <Brain className="w-5 h-5" />;
      default:
        return <BookTemplate className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "health":
        return "בריאות";
      case "productivity":
        return "פרודוקטיביות";
      case "learning":
        return "למידה";
      default:
        return category;
    }
  };

  const renderTemplates = (category: "health" | "productivity" | "learning") => {
    const templates = habitTemplates.filter((t) => t.templateCategory === category);

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: template.color }}
                    />
                    {template.title}
                  </CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {getCategoryIcon(template.category)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                {template.preferredTime && (
                  <span className="text-sm text-muted-foreground">
                    ⏰ {template.preferredTime}
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={() => handleAddTemplate(template)}
                  className="mr-auto gap-1"
                >
                  <Plus className="w-4 h-4" />
                  הוסף
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <BookTemplate className="h-5 w-5" />
          ספריית תבניות
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookTemplate className="h-6 w-6" />
            ספריית תבניות הרגלים
          </DialogTitle>
          <DialogDescription>
            בחר מתוך הרגלים מוכנים מראש והוסף אותם לרשימה שלך בקליק אחד
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="health" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="gap-2">
              <Heart className="w-4 h-4" />
              בריאות
            </TabsTrigger>
            <TabsTrigger value="productivity" className="gap-2">
              <Zap className="w-4 h-4" />
              פרודוקטיביות
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-2">
              <Brain className="w-4 h-4" />
              למידה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="mt-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">הרגלי בריאות</h3>
              <p className="text-sm text-muted-foreground">
                הרגלים לשמירה על בריאות הגוף והנפש
              </p>
            </div>
            {renderTemplates("health")}
          </TabsContent>

          <TabsContent value="productivity" className="mt-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">הרגלי פרודוקטיביות</h3>
              <p className="text-sm text-muted-foreground">
                הרגלים לשיפור היעילות והמיקוד
              </p>
            </div>
            {renderTemplates("productivity")}
          </TabsContent>

          <TabsContent value="learning" className="mt-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">הרגלי למידה</h3>
              <p className="text-sm text-muted-foreground">
                הרגלים לפיתוח ידע וצמיחה אישית
              </p>
            </div>
            {renderTemplates("learning")}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};