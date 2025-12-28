import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useSidebarPin } from "@/hooks/useSidebarPin";

export const SidebarEdgeTrigger = () => {
  const { setOpen, setOpenMobile, isMobile, open, openMobile } = useSidebar();
  const { pinned } = useSidebarPin();
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      
      // Only trigger if horizontal swipe is dominant (not scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const screenWidth = window.innerWidth;
        
        // Swipe left from right edge to open (sidebar is on right)
        if (deltaX < -50 && touchStartX.current > screenWidth - 50 && !openMobile) {
          setOpenMobile(true);
        }
        
        // Swipe right to close
        if (deltaX > 50 && openMobile) {
          setOpenMobile(false);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, openMobile, setOpenMobile]);

  // Desktop edge trigger (unchanged)
  if (pinned || isMobile || open) {
    return null;
  }

  return (
    <div
      className="fixed top-0 right-0 w-4 h-full z-40 cursor-pointer"
      onMouseEnter={() => setOpen(true)}
      aria-hidden="true"
    />
  );
};
