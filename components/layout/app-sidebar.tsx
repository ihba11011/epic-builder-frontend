"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BookOpen,
  TestTube2,
  Users,
  Bell,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { UserRole } from "@/lib/types"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]
  children?: NavItem[]
}

const getNavItems = (projectId?: string): NavItem[] => [
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: "/app/projects",
    icon: FolderKanban,
  },
  ...(projectId
    ? [
        {
          label: "Documents",
          href: `/app/projects/${projectId}/documents`,
          icon: FileText,
          roles: ["admin", "pm", "ba", "qa"],
        },
        {
          label: "User Stories",
          href: `/app/projects/${projectId}/user-stories`,
          icon: BookOpen,
          roles: ["admin", "pm", "ba"],
        },
        {
          label: "Test Cases",
          href: `/app/projects/${projectId}/test-cases`,
          icon: TestTube2,
          roles: ["admin", "pm", "qa"],
        },
        {
          label: "Users",
          href: `/app/projects/${projectId}/team`,
          icon: Users,
          roles: ["admin", "pm"],
        },
        {
          label: "Activity",
          href: `/app/projects/${projectId}/activity`,
          icon: Activity,
          roles: ["admin", "pm"],
        },
      ]
    : []),
  {
    label: "Notifications",
    href: "/app/notifications",
    icon: Bell,
  },
]

const adminNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/app/admin",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    label: "User Management",
    href: "/app/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Audit Logs",
    href: "/app/admin/audit-logs",
    icon: Activity,
    roles: ["admin"],
  },
  {
    label: "Workspace",
    href: "/app/admin/workspace",
    icon: Shield,
    roles: ["admin"],
  },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentProjectId?: string
}

export function AppSidebar({ collapsed, onToggle, currentProjectId }: AppSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const navItems = getNavItems(currentProjectId)
  const filteredNavItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))
  const filteredAdminItems = adminNavItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 h-screen border-r border-border bg-card flex flex-col"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">SDLC Hub</span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}

          {/* Admin Section */}
          {user && user.role === "admin" && (
            <>
              <div className="my-4 border-t border-border" />
              {!collapsed && (
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</p>
              )}
              {filteredAdminItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={pathname === item.href} collapsed={collapsed} />
              ))}
            </>
          )}
        </nav>

        {/* Toggle Button */}
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-center">
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}
