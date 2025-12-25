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
    <header className="h-12 sm:h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 overflow-x-hidden" dir="rtl">
      <div className="flex items-center gap-1 sm:gap-2 mr-2 sm:mr-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleSidebar()}
          className="h-8 w-8 sm:h-10 sm:w-10"
          aria-label="פתח תפריט"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <span className="font-semibold text-sm sm:text-base md:text-lg hidden xs:inline">מעקב הרגלים</span>
      </div>
      <div className="ml-2 sm:ml-3" />
    </header>
  );
};
