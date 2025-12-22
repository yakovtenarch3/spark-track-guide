import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSidebarPin } from "@/hooks/useSidebarPin";

export const TopBar = () => {
  const { toggleSidebar, setOpen, isMobile } = useSidebar();
  const { pinned } = useSidebarPin();
  const location = useLocation();

  // Auto-hide after navigation when not pinned
  useEffect(() => {
    if (!pinned && !isMobile) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, pinned, isMobile]);

  return (
    <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50" dir="rtl">
      <div className="flex items-center gap-2 mr-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleSidebar()}
          className="h-10 w-10"
          aria-label="פתח תפריט"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-lg hidden sm:inline">מעקב הרגלים</span>
      </div>
      <div className="ml-3" />
    </header>
  );
};
