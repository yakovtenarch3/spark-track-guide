import { useSidebar } from "@/components/ui/sidebar";
import { useSidebarPin } from "@/hooks/useSidebarPin";

export const SidebarEdgeTrigger = () => {
  const { setOpen, isMobile, open } = useSidebar();
  const { pinned } = useSidebarPin();

  // Only show trigger when sidebar is not pinned, not open, and not on mobile
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
