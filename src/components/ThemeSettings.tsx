import { Settings, Palette, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useTheme } from "@/hooks/useTheme";
import { CustomThemeDialog } from "./CustomThemeDialog";
import { useState } from "react";

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

export const ThemeSettings = () => {
  const { currentTheme, setTheme, themes, addCustomTheme, deleteCustomTheme } = useTheme();
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  const handleThemeChange = (themeName: string) => {
    setTheme(themeName);
  };

  const handleDeleteTheme = (themeName: string) => {
    deleteCustomTheme(themeName);
    setThemeToDelete(null);
  };

  const handleAddTheme = (name: string, colors: ExtendedThemeColors) => {
    addCustomTheme(name, colors);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" dir="rtl">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform bg-primary hover:bg-primary/90"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            ערכות נושא
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1">
            <CustomThemeDialog onSaveTheme={handleAddTheme} />
          </div>
          
          <DropdownMenuSeparator />
          
          {Object.values(themes).map((theme) => (
            <DropdownMenuItem
              key={theme.name}
              className={`cursor-pointer ${
                currentTheme === theme.name ? "bg-accent" : ""
              }`}
              onSelect={(e) => {
                if ((e.target as HTMLElement).closest('.delete-btn')) {
                  return;
                }
                handleThemeChange(theme.name);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex gap-0.5">
                  <div
                    className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                    style={{ background: `hsl(${theme.colors.primary})` }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                    style={{ background: `hsl(${theme.colors.secondary})` }}
                  />
                </div>
                <span className="flex-1 truncate">{theme.label}</span>
                <div className="flex items-center gap-1">
                  {currentTheme === theme.name && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                  {theme.isCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 delete-btn hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThemeToDelete(theme.name);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </div>
  );
};