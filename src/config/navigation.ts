import {
  LayoutDashboard,
  Bot,
  BarChart3,
  Blocks,
  Calendar,
  Mail,
  Database,
  FileText,
  Building2,
  Bell,
  Users,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    groupTitle: "Core Modules",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "AI Chat", href: "/dashboard/ai-assistant", icon: Bot, badge: "New" },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { title: "Workspaces", href: "/dashboard/workspace-manager", icon: Building2 },
      { title: "Workspace", href: "/dashboard/workspace", icon: Blocks },
      { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
      { title: "Company Mail", href: "/dashboard/company-mail", icon: Mail, badge: "Gmail" },
      { title: "Datasets", href: "/dashboard/files", icon: Database },
      { title: "Documents", href: "/dashboard/documents", icon: FileText },
    ],
  },
  {
    groupTitle: "Preferences & Support",
    items: [
      { title: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: "3" },
      { title: "Team", href: "/dashboard/team", icon: Users },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
      { title: "Help", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];


