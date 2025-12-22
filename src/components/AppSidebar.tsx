import { useState } from "react";
import { Home, Target, Trophy, Archive, Settings, Sun, ListChecks, MessageCircle, Pin, PinOff, BookOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useSidebarPin } from "@/hooks/useSidebarPin";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items = [{
  title: "בית",
  url: "/",
  icon: Home
}, {
  title: "הרגלים",
  url: "/habits",
  icon: Target
}, {
  title: "קימה בבוקר",
  url: "/wake-up",
  icon: Sun
}, {
  title: "יעדים יומיים",
  url: "/daily-goals",
  icon: ListChecks
}, {
  title: "הספר שלי",
  url: "/book",
  icon: BookOpen
}, {
  title: "מאמן AI",
  url: "/ai-coach",
  icon: MessageCircle
}, {
  title: "הישגים",
  url: "/achievements",
  icon: Trophy
}, {
  title: "ארכיון",
  url: "/archive",
  icon: Archive
}, {
  title: "הגדרות",
  url: "/settings",
  icon: Settings
}];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const { pinned, togglePinned } = useSidebarPin();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Sidebar 
      side="right" 
      collapsible={pinned ? "icon" : "offcanvas"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-[hsl(var(--sidebar-background,var(--background)))] border-[hsl(var(--sidebar-border,var(--border)))]"
    >
      <SidebarContent className="bg-transparent rounded-xl"dir="rtl">
        {/* Pin button - only visible on hover and not mobile */}
        {!isMobile && (
          <div className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[hsl(var(--sidebar-foreground,var(--foreground)))]"
                  aria-label={pinned ? "ביטול הצמדה" : "הצמד סיידבר"}
                  onClick={togglePinned}
                >
                  {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{pinned ? "ביטול הצמדה (אוטוהייד)" : "הצמד סיידבר"}</TooltipContent>
            </Tooltip>
          </div>
        )}

        <SidebarGroup className="mt-10">
          <SidebarGroupLabel className="text-[hsl(var(--sidebar-foreground,var(--foreground)))]">תפריט ראשי</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)} 
                    className="text-[hsl(var(--sidebar-foreground,var(--foreground)))] hover:bg-[hsl(var(--sidebar-accent,var(--accent)))] data-[active=true]:bg-primary data-[active=true]:text-primary-foreground rounded-xl"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="ml-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}