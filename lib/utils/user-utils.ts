import type { User, UserRole, UserStatus } from "@/lib/types"

export const userUtils = {
  // Format user display name
  getDisplayName: (user: User): string => {
    return user.name || user.email.split("@")[0]
  },

  // Get user initials for avatar
  getInitials: (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  },

  // Check if user is admin
  isAdmin: (user: User): boolean => {
    return user.role === "admin"
  },

  // Check if user can manage other users
  canManageUsers: (user: User): boolean => {
    return user.role === "admin" || user.role === "sub-admin"
  },

  // Check if user is active
  isActive: (user: User): boolean => {
    return user.status === "active"
  },

  // Format last login
  getLastLoginText: (lastLogin?: string): string => {
    if (!lastLogin) return "Never logged in"
    const date = new Date(lastLogin)
    return date.toLocaleDateString()
  },

  // Get role display label
  getRoleLabel: (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      admin: "Administrator",
      "sub-admin": "Sub-Administrator",
      pm: "Project Manager",
      ba: "Business Analyst",
      qa: "QA Engineer",
      developer: "Developer",
    }
    return labels[role]
  },

  // Get status display label
  getStatusLabel: (status: UserStatus): string => {
    const labels: Record<UserStatus, string> = {
      active: "Active",
      inactive: "Inactive",
      deleted: "Deleted",
    }
    return labels[status]
  },

  // Sort users by multiple criteria
  sortUsers: (users: User[], sortBy: "name" | "role" | "status" | "date" = "name"): User[] => {
    const sorted = [...users]
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case "role":
        return sorted.sort((a, b) => a.role.localeCompare(b.role))
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status))
      case "date":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      default:
        return sorted
    }
  },

  // Filter users by multiple criteria
  filterUsers: (
    users: User[],
    filters: {
      search?: string
      role?: UserRole
      status?: UserStatus
      dateFrom?: string
      dateTo?: string
    },
  ): User[] => {
    return users.filter((user) => {
      // Search filter
      if (
        filters.search &&
        !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !user.email.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      // Role filter
      if (filters.role && user.role !== filters.role) {
        return false
      }

      // Status filter
      if (filters.status && user.status !== filters.status) {
        return false
      }

      // Date range filter
      if (filters.dateFrom) {
        const userDate = new Date(user.createdAt)
        const fromDate = new Date(filters.dateFrom)
        if (userDate < fromDate) {
          return false
        }
      }

      if (filters.dateTo) {
        const userDate = new Date(user.createdAt)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (userDate > toDate) {
          return false
        }
      }

      return true
    })
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Check if can delete user
  canDeleteUser: (currentUser: User, targetUser: User): boolean => {
    return currentUser.role === "admin" && currentUser.id !== targetUser.id
  },
}
