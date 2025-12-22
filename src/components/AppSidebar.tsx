import { Home, Target, Trophy, Archive, Settings, Sun, ListChecks, MessageCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useSidebarPin } from "@/hooks/useSidebarPin";
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
  const { state } = useSidebar();
  const { pinned } = useSidebarPin();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";
  return <Sidebar side="right" collapsible={pinned ? "icon" : "offcanvas"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>תפריט ראשי</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="text-sidebar-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground">
                    <NavLink to={item.url} end>
                      <item.icon className="ml-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}