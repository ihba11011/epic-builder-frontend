import type { UserRole, Permission } from "./types"

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    { module: "projects", read: true, write: true, delete: true, approve: true },
    { module: "documents", read: true, write: true, delete: true, approve: true },
    { module: "stories", read: true, write: true, delete: true, approve: true },
    { module: "tests", read: true, write: true, delete: true, approve: true },
    { module: "users", read: true, write: true, delete: true, approve: true },
    { module: "audit", read: true, write: false, delete: false, approve: false },
    { module: "workspaces", read: true, write: true, delete: true, approve: true },
  ],
  "sub-admin": [
    { module: "projects", read: true, write: true, delete: false, approve: true },
    { module: "documents", read: true, write: true, delete: true, approve: true },
    { module: "stories", read: true, write: true, delete: true, approve: true },
    { module: "tests", read: true, write: true, delete: true, approve: true },
    { module: "users", read: true, write: true, delete: false, approve: false },
    { module: "audit", read: true, write: false, delete: false, approve: false },
    { module: "workspaces", read: true, write: false, delete: false, approve: false },
  ],
  pm: [
    { module: "projects", read: true, write: true, delete: false, approve: true },
    { module: "documents", read: true, write: true, delete: false, approve: true },
    { module: "stories", read: true, write: true, delete: false, approve: true },
    { module: "tests", read: true, write: false, delete: false, approve: false },
    { module: "users", read: true, write: false, delete: false, approve: false },
    { module: "audit", read: true, write: false, delete: false, approve: false },
    { module: "workspaces", read: true, write: false, delete: false, approve: false },
  ],
  ba: [
    { module: "projects", read: true, write: false, delete: false, approve: false },
    { module: "documents", read: true, write: true, delete: false, approve: false },
    { module: "stories", read: true, write: true, delete: false, approve: false },
    { module: "tests", read: true, write: false, delete: false, approve: false },
    { module: "users", read: false, write: false, delete: false, approve: false },
    { module: "audit", read: false, write: false, delete: false, approve: false },
    { module: "workspaces", read: true, write: false, delete: false, approve: false },
  ],
  qa: [
    { module: "projects", read: true, write: false, delete: false, approve: false },
    { module: "documents", read: true, write: false, delete: false, approve: false },
    { module: "stories", read: true, write: false, delete: false, approve: false },
    { module: "tests", read: true, write: true, delete: true, approve: false },
    { module: "users", read: false, write: false, delete: false, approve: false },
    { module: "audit", read: false, write: false, delete: false, approve: false },
    { module: "workspaces", read: true, write: false, delete: false, approve: false },
  ],
  developer: [
    { module: "projects", read: true, write: false, delete: false, approve: false },
    { module: "documents", read: true, write: false, delete: false, approve: false },
    { module: "stories", read: true, write: false, delete: false, approve: false },
    { module: "tests", read: true, write: false, delete: false, approve: false },
    { module: "users", read: false, write: false, delete: false, approve: false },
    { module: "audit", read: false, write: false, delete: false, approve: false },
    { module: "workspaces", read: true, write: false, delete: false, approve: false },
  ],
}

export function hasPermission(
  role: UserRole,
  module: string,
  action: "read" | "write" | "delete" | "approve",
): boolean {
  const permissions = rolePermissions[role]
  const modulePermission = permissions.find((p) => p.module === module)
  return modulePermission?.[action] ?? false
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  // Admin routes
  if (path.startsWith("/app/admin")) {
    return role === "admin"
  }
  // Sub-admin routes
  if (path.startsWith("/app/subadmin")) {
    return role === "admin" || role === "sub-admin"
  }
  // All other app routes are accessible
  return true
}
