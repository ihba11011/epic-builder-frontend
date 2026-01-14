"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { AlertCircle } from "lucide-react"
import RolesPermissions from "@/components/admin/roles-permissions"

export default function RolesPage() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.push("/app/403")
    }
  }, [currentUser])

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access role management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles and their associated permissions"
        breadcrumbs={[{ label: "Admin", href: "/app/admin" }, { label: "Roles & Permissions" }]}
      />

      <RolesPermissions />
    </div>
  )
}
