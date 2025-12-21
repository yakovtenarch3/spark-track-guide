import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pin, PinOff } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSidebarPin } from "@/hooks/useSidebarPin";

export const TopBar = () => {
  const { toggleSidebar, setOpen } = useSidebar();
  const { pinned, togglePinned } = useSidebarPin();
  const location = useLocation();

  // Auto-hide after navigation when not pinned
  useEffect(() => {
    if (!pinned) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, pinned]);

  return (
    <header className="h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10" dir="rtl">
      <div className="flex items-center gap-2 mr-2">
        <SidebarTrigger className="mr-1" onClick={() => toggleSidebar()} />
      </div>
      <div className="flex items-center gap-2 ml-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={pinned ? "ביטול הצמדה" : "הצמד סיידבר"}
              onClick={togglePinned}
            >
              {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{pinned ? "ביטול הצמדה (אוטוהייד)" : "הצמד סיידבר"}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};
