import { Settings, Palette, Trash2, Download, Upload, Edit, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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
import { CustomThemeDialog } from "./CustomThemeDialogAdvanced";
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
  const [themeToEdit, setThemeToEdit] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleExportTheme = (themeName: string) => {
    const theme = themes[themeName];
    if (!theme) return;

    const exportData = {
      name: theme.name,
      label: theme.label,
      colors: theme.colors,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-${theme.name}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "✅ ערכת נושא יוצאה בהצלחה",
      description: `${theme.label} נשמר כקובץ JSON`,
    });
  };

  const handleImportTheme = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.name || !data.colors) {
          throw new Error("Invalid theme file");
        }

        addCustomTheme(data.name, data.colors);
        toast({
          title: "✅ ערכת נושא יובאה בהצלחה",
          description: `${data.label || data.name} נוסף למערכת`,
        });
      } catch (error) {
        toast({
          title: "❌ שגיאה ביבוא",
          description: "הקובץ אינו תקין",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handleEditTheme = (themeName: string) => {
    setThemeToEdit(themeName);
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
          
          {/* Import/Export */}
          <div className="px-2 py-1 space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleImportTheme}
            >
              <Upload className="w-4 h-4 mr-2" />
              יבוא ערכת נושא
            </Button>
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
                  
                  {/* Export button for all themes */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 delete-btn hover:bg-blue-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportTheme(theme.name);
                    }}
                    title="יצוא ערכת נושא"
                  >
                    <Download className="w-3 h-3 text-blue-500" />
                  </Button>
                  
                  {/* Edit button for custom themes */}
                  {theme.isCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 delete-btn hover:bg-orange-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTheme(theme.name);
                      }}
                      title="ערוך ערכת נושא"
                    >
                      <Edit className="w-3 h-3 text-orange-500" />
                    </Button>
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
                      title="מחק ערכת נושא"
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

      {/* Edit Theme Dialog */}
      {themeToEdit && themes[themeToEdit] && (
        <CustomThemeDialog
          onSaveTheme={(name, colors) => {
            handleAddTheme(name, colors);
            setThemeToEdit(null);
          }}
          editMode={true}
          existingTheme={{
            name: themes[themeToEdit].name,
            label: themes[themeToEdit].label,
            colors: themes[themeToEdit].colors,
          }}
          onClose={() => setThemeToEdit(null)}
        />
      )}
    </div>
  );
};