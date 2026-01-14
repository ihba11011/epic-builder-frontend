"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore, useUserManagementStore } from "@/lib/store"
import { userService, auditService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, Mail, Calendar, Shield, Users, Activity, Lock } from "lucide-react"
import type { User, UserStatus } from "@/lib/types"
import { toast } from "sonner"
import UserAvatar from "@/components/admin/user-avatar"
import RoleBadge from "@/components/admin/role-badge"
import StatusBadge from "@/components/admin/status-badge"
import { dateUtils } from "@/lib/utils/date-utils"
import { userUtils } from "@/lib/utils/user-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser } = useAuthStore()
  const { updateUser } = useUserManagementStore()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusChangeTarget, setStatusChangeTarget] = useState<UserStatus | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const currentUserId = currentUser?.id || ""

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role !== "admin") {
      router.push("/app/403")
      return
    }
    loadUser()
  }, [currentUser, userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const userData = await userService.get(userId)
      if (!userData) {
        toast.error("User not found")
        router.push("/app/admin/users")
        return
      }
      setUser(userData)
    } catch (error) {
      console.error("Error loading user:", error)
      toast.error("Failed to load user details")
      router.push("/app/admin/users")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: UserStatus) => {
    setStatusChangeTarget(newStatus)
    setShowStatusDialog(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!user || !statusChangeTarget) return
    setIsChangingStatus(true)
    try {
      const updated = await userService.update(user.id, { status: statusChangeTarget })
      setUser(updated)
      updateUser(user.id, updated)
      await auditService.append({
        workspaceId: "ws-1",
        userId: currentUser?.id || "",
        userName: currentUser?.name || "Admin",
        action: "CHANGE_USER_STATUS",
        module: "USER_MANAGEMENT",
        details: `Changed user ${user.name} status from ${user.status} to ${statusChangeTarget}`,
      })
      toast.success(`User marked as ${statusChangeTarget}`)
      setShowStatusDialog(false)
      setStatusChangeTarget(null)
    } catch (error) {
      console.error("Error changing status:", error)
      toast.error("Failed to change user status")
    } finally {
      setIsChangingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading User Details</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={user.name}
        description={user.email}
        breadcrumbs={[
          { label: "Admin", href: "/app/admin" },
          { label: "Users", href: "/app/admin/users" },
          { label: user.name },
        ]}
        actions={
          <div className="flex gap-2">
            {user.status === "active" && currentUserId !== user.id && (
              <Button variant="outline" onClick={() => handleStatusChange("inactive")} className="text-orange-600">
                Mark as Inactive
              </Button>
            )}
            {user.status === "inactive" && currentUserId !== user.id && (
              <Button variant="outline" onClick={() => handleStatusChange("active")} className="text-green-600">
                Mark as Active
              </Button>
            )}
            <Button onClick={() => router.push(`/app/admin/users/${userId}/edit`)}>Edit User</Button>
          </div>
        }
      />

      {/* User Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <UserAvatar name={user.name} size="lg" />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <RoleBadge role={user.role} showIcon />
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User ID</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Account Status</p>
                  <StatusBadge status={user.status} />
                </div>
              </CardContent>
            </Card>

            {/* Role Information */}
            <Card>
              <CardHeader>
                <CardTitle>Role Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Assigned Role</p>
                  <RoleBadge role={user.role} showIcon className="text-base px-3 py-2" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Role Description</p>
                  <p className="text-sm text-muted-foreground">{userUtils.getRoleLabel(user.role)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Dates & Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Dates & Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Created On</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{dateUtils.formatDateTime(user.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Last Login</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {user.lastLogin ? dateUtils.formatDateTime(user.lastLogin) : "Never"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Last Activity</p>
                  <span className="text-sm text-muted-foreground">
                    {user.lastActivity ? dateUtils.getRelativeTime(user.lastActivity) : "No activity"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Workspaces & Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Access Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Workspaces
                  </p>
                  <p className="text-2xl font-bold">{user.workspaceIds.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Projects
                  </p>
                  <p className="text-2xl font-bold">{user.assignedProjectIds.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Recent actions and interactions by this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">{dateUtils.formatDateTime(user.createdAt)}</p>
                  </div>
                </div>
                {user.lastLogin && (
                  <div className="flex items-start gap-4 pb-4 border-b">
                    <Activity className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">{dateUtils.formatDateTime(user.lastLogin)}</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground italic">More detailed activity logs coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Security information and status for this user account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-muted-foreground">
                        {user.status === "active" ? "Account is active and in good standing" : "Account is inactive"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email Verified</p>
                      <p className="text-sm text-muted-foreground">Email address has been verified</p>
                    </div>
                  </div>
                  <Badge variant="default">Verified</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Last login information and security events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Last Login</p>
                  <p className="text-sm">
                    {user.lastLogin ? dateUtils.formatDateTime(user.lastLogin) : "Never logged in"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground italic">Detailed security logs coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark <span className="font-semibold">{user?.name}</span> as{" "}
              <span className="font-semibold capitalize">{statusChangeTarget}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={isChangingStatus}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStatusChange} disabled={isChangingStatus}>
              {isChangingStatus ? "Changing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
