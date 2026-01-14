"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, useAuditStore } from "@/lib/store"
import { auditService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import AuditLogsViewer from "@/components/admin/audit-logs-viewer"

export default function AuditLogsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const { auditLogs, setAuditLogs } = useAuditStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    if (currentUser.role !== "admin") {
      router.push("/app/403")
      return
    }

    loadAuditLogs()
  }, [currentUser])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const logs = await auditService.list({ workspaceId: "ws-1" })
      setAuditLogs(logs)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      toast.error("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access audit logs.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading Audit Logs</h2>
          <p className="text-muted-foreground">Please wait while we fetch the audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        description="View system activity and user actions across the platform"
        breadcrumbs={[{ label: "Admin", href: "/app/admin" }, { label: "Audit Logs" }]}
      />

      {auditLogs.length > 0 ? (
        <AuditLogsViewer logs={auditLogs} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No audit logs available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
