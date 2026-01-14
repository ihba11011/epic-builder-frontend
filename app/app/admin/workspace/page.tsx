"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, Lock, Users, Bell, Shield } from "lucide-react"

export default function WorkspacePage() {
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
          <p className="text-muted-foreground">You do not have permission to access workspace settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspace Settings"
        description="Manage workspace configuration and organization settings"
        breadcrumbs={[{ label: "Admin", href: "/app/admin" }, { label: "Workspace" }]}
      />

      <div className="space-y-6">
        {/* Workspace Information */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Information</CardTitle>
            <CardDescription>Basic workspace details and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input id="workspace-name" value="Main Workspace" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-id">Workspace ID</Label>
                <Input id="workspace-id" value="ws-1" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="created-date">Created Date</Label>
                <Input id="created-date" value="January 15, 2024" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Input id="plan" value="Enterprise" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <div>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and authentication policies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
                  <p className="text-xs text-muted-foreground mt-1">Require 2FA for all users</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Password Policy</h4>
                  <p className="text-xs text-muted-foreground mt-1">Minimum 12 characters, mixed case</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Session Timeout</h4>
                  <p className="text-xs text-muted-foreground mt-1">Inactive sessions expire after 24 hours</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>Member Settings</CardTitle>
                <CardDescription>Configure member policies and defaults</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Default Member Role</h4>
                  <p className="text-xs text-muted-foreground mt-1">Set default role for new invitations</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Invitation Expiry</h4>
                  <p className="text-xs text-muted-foreground mt-1">Invitations expire after 7 days</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <div>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control workspace notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Admin Notifications</h4>
                  <p className="text-xs text-muted-foreground mt-1">Notify admins on critical actions</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <div>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage data retention and privacy policies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Audit Log Retention</h4>
                  <p className="text-xs text-muted-foreground mt-1">Keep audit logs for 90 days</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Data Export</h4>
                  <p className="text-xs text-muted-foreground mt-1">Allow users to export their data</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
