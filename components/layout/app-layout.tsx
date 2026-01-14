"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthStore, useUIStore, useWorkspaceStore, useNotificationStore, useProjectStore } from "@/lib/store"
import { workspaceService, notificationService, projectService } from "@/lib/services"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { canAccessRoute } from "@/lib/permissions"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { setWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const { setNotifications } = useNotificationStore()
  const { setProjects, currentProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)

  // Extract project ID from pathname if present
  const projectIdMatch = pathname.match(/\/projects\/([^/]+)/)
  const currentProjectId = projectIdMatch?.[1]

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    // Check route access
    if (user && !canAccessRoute(user.role, pathname)) {
      router.push("/app/403")
      return
    }

    // Load initial data
    const loadData = async () => {
      try {
        const [workspacesData, notificationsData, projectsData] = await Promise.all([
          workspaceService.list(),
          user ? notificationService.list(user.id) : Promise.resolve([]),
          projectService.list(),
        ])
        setWorkspaces(workspacesData)
        if (workspacesData.length > 0) {
          setCurrentWorkspace(workspacesData[0])
        }
        setNotifications(notificationsData)
        setProjects(projectsData)
      } catch (error) {
        console.error("Failed to load initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, user, pathname, router, setWorkspaces, setCurrentWorkspace, setNotifications, setProjects])

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} currentProjectId={currentProjectId} />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col min-h-screen"
      >
        <AppHeader />
        <main className="flex-1 p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
