import type { AuditLog } from "@/lib/types"

export const activityUtils = {
  // Get action display label
  getActionLabel: (action: string): string => {
    const labels: Record<string, string> = {
      CREATE_USER: "User Created",
      UPDATE_USER: "User Updated",
      DELETE_USER: "User Deleted",
      LOGIN: "Login",
      LOGOUT: "Logout",
      UPDATE_PROFILE: "Profile Updated",
      CHANGE_PASSWORD: "Password Changed",
      UPDATE_PERMISSIONS: "Permissions Updated",
      CREATE_PROJECT: "Project Created",
      UPDATE_PROJECT: "Project Updated",
      DELETE_PROJECT: "Project Deleted",
      CREATE_STORY: "Story Created",
      UPDATE_STORY: "Story Updated",
      DELETE_STORY: "Story Deleted",
      CREATE_TEST: "Test Created",
      UPDATE_TEST: "Test Updated",
      DELETE_TEST: "Test Deleted",
    }
    return labels[action] || action.replace(/_/g, " ")
  },

  // Get module display label
  getModuleLabel: (module: string): string => {
    const labels: Record<string, string> = {
      USER_MANAGEMENT: "User Management",
      PROJECT_MANAGEMENT: "Project Management",
      STORY_MANAGEMENT: "Story Management",
      TEST_MANAGEMENT: "Test Management",
      DOCUMENT_MANAGEMENT: "Document Management",
      WORKSPACE_MANAGEMENT: "Workspace Management",
      AUTHENTICATION: "Authentication",
      SYSTEM: "System",
    }
    return labels[module] || module.replace(/_/g, " ")
  },

  // Get action color for UI
  getActionColor: (action: string): string => {
    if (action.includes("CREATE")) return "text-green-600"
    if (action.includes("UPDATE")) return "text-blue-600"
    if (action.includes("DELETE")) return "text-red-600"
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "text-yellow-600"
    return "text-gray-600"
  },

  // Get action icon background color
  getActionBgColor: (action: string): string => {
    if (action.includes("CREATE")) return "bg-green-100 dark:bg-green-900/20"
    if (action.includes("UPDATE")) return "bg-blue-100 dark:bg-blue-900/20"
    if (action.includes("DELETE")) return "bg-red-100 dark:bg-red-900/20"
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "bg-yellow-100 dark:bg-yellow-900/20"
    return "bg-gray-100 dark:bg-gray-900/20"
  },

  // Group activities by date
  groupActivitiesByDate: (activities: AuditLog[]): Record<string, AuditLog[]> => {
    return activities.reduce(
      (acc, activity) => {
        const date = new Date(activity.createdAt).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(activity)
        return acc
      },
      {} as Record<string, AuditLog[]>,
    )
  },

  // Calculate activity statistics
  getActivityStats: (
    activities: AuditLog[],
  ): {
    totalActions: number
    createdCount: number
    updatedCount: number
    deletedCount: number
    mostActiveModule: string
  } => {
    return {
      totalActions: activities.length,
      createdCount: activities.filter((a) => a.action.includes("CREATE")).length,
      updatedCount: activities.filter((a) => a.action.includes("UPDATE")).length,
      deletedCount: activities.filter((a) => a.action.includes("DELETE")).length,
      mostActiveModule:
        Object.entries(
          activities.reduce(
            (acc, a) => {
              acc[a.module] = (acc[a.module] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          ),
        ).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A",
    }
  },
}
