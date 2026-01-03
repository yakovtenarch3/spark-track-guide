import { Palette, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { CustomThemeDialog } from "./CustomThemeDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExtendedThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  card?: string;
  cardBorder?: string;
  fontColor?: string;
  headingColor?: string;
  borderColor?: string;
  buttonBg?: string;
  buttonText?: string;
  accent?: string;
  sidebarBackground?: string;
  sidebarForeground?: string;
  sidebarBorder?: string;
}

export const ThemeSelector = () => {
  const {
    currentTheme,
    setTheme,
    themes,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme
  } = useTheme();
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);
  const [themeToEdit, setThemeToEdit] = useState<Theme | null>(null);

  const handleThemeChange = (themeName: string) => {
    setTheme(themeName);
  };

  const handleDeleteTheme = (themeName: string) => {
    deleteCustomTheme(themeName);
    setThemeToDelete(null);
  };

  const handleEditTheme = (name: string, colors: ExtendedThemeColors) => {
    if (themeToEdit) {
      updateCustomTheme(themeToEdit.name, name, colors);
    }
  };

  const handleAddTheme = (name: string, colors: ExtendedThemeColors) => {
    addCustomTheme(name, colors);
  };

  return <div className="space-y-4" dir="rtl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5" />
        <h3 className="text-lg font-medium">בחר ערכת נושא</h3>
      </div>
      <CustomThemeDialog onSaveTheme={handleAddTheme} />
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Object.values(themes).map(theme => (
        <div 
          key={theme.name} 
          className={cn(
            "relative rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md", 
            currentTheme === theme.name ? "border-primary shadow-md" : "border-border hover:border-primary/50"
          )} 
          onClick={() => handleThemeChange(theme.name)}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div 
                className="w-6 h-6 rounded-full border border-border flex-shrink-0" 
                style={{ background: `hsl(${theme.colors.primary})` }} 
              />
              <div 
                className="w-6 h-6 rounded-full border border-border flex-shrink-0" 
                style={{ background: `hsl(${theme.colors.secondary})` }} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-foreground">{theme.label}</p>
              {currentTheme === theme.name && <p className="text-xs text-muted-foreground">פעיל</p>}
            </div>
          </div>
          
          {/* אייקוני עריכה ומחיקה - לכל ערכות הנושא */}
          <div className="absolute top-2 left-2 flex gap-1">
            <CustomThemeDialog 
              editTheme={theme.isCustom ? themeToEdit : null}
              onSaveTheme={theme.isCustom ? handleEditTheme : handleAddTheme}
              onEditComplete={() => setThemeToEdit(null)}
              defaultValues={!theme.isCustom ? { name: `${theme.label} (מותאם)`, colors: theme.colors as ExtendedThemeColors } : undefined}
              trigger={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 hover:bg-primary/10" 
                  onClick={e => {
                    e.stopPropagation();
                    if (theme.isCustom) {
                      setThemeToEdit(theme);
                    }
                  }}
                  title={theme.isCustom ? "ערוך ערכת נושא" : "צור עותק מותאם"}
                >
                  <Edit2 className="w-3 h-3 text-primary" />
                </Button>
              } 
            />
            {theme.isCustom && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-destructive/10" 
                onClick={e => {
                  e.stopPropagation();
                  setThemeToDelete(theme.name);
                }}
                title="מחק ערכת נושא"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>

    <AlertDialog open={!!themeToDelete} onOpenChange={() => setThemeToDelete(null)}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת ערכת נושא</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את ערכת הנושא "{themeToDelete}"? פעולה זו לא ניתנת לביטול.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => themeToDelete && handleDeleteTheme(themeToDelete)} 
            className="bg-destructive hover:bg-destructive/90"
          >
            מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
};