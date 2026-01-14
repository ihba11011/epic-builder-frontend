"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore, useUserManagementStore } from "@/lib/store"
import { userService, auditService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react"
import type { User, UserStatus } from "@/lib/types"
import { toast } from "sonner"
import { userUtils } from "@/lib/utils/user-utils"

export default function UserEditPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser } = useAuthStore()
  const { updateUser } = useUserManagementStore()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: "",
    role: "developer" as const,
    status: "active" as UserStatus,
  })

  const [originalData, setOriginalData] = useState({
    name: "",
    role: "developer" as const,
    status: "active" as UserStatus,
  })

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role !== "admin") {
      router.push("/app/403")
      return
    }
    loadUser()
  }, [currentUser, userId])

  useEffect(() => {
    const changed =
      formData.name !== originalData.name ||
      formData.role !== originalData.role ||
      formData.status !== originalData.status
    setHasChanges(changed)
  }, [formData, originalData])

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
      const data = {
        name: userData.name,
        role: userData.role,
        status: userData.status,
      }
      setFormData(data)
      setOriginalData(data)
    } catch (error) {
      console.error("Error loading user:", error)
      toast.error("Failed to load user details")
      router.push("/app/admin/users")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters"
    } else if (formData.name.trim().length > 100) {
      errors.name = "Name must be less than 100 characters"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors")
      return
    }

    setSaving(true)
    try {
      const updated = await userService.update(userId, {
        name: formData.name.trim(),
        role: formData.role,
        status: formData.status,
      })
      updateUser(userId, updated)

      await auditService.append({
        workspaceId: "ws-1",
        userId: currentUser?.id || "",
        userName: currentUser?.name || "Admin",
        action: "UPDATE_USER",
        module: "USER_MANAGEMENT",
        details: `Updated user ${updated.name}: Name=${updated.name}, Role=${updated.role}, Status=${updated.status}`,
      })

      toast.success("User updated successfully")
      router.push(`/app/admin/users/${userId}`)
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        router.push(`/app/admin/users/${userId}`)
      }
    } else {
      router.push(`/app/admin/users/${userId}`)
    }
  }

  const handleReset = () => {
    setFormData(originalData)
    setValidationErrors({})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading User</h2>
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
        title={`Edit ${user.name}`}
        description="Update user information and permissions"
        breadcrumbs={[
          { label: "Admin", href: "/app/admin" },
          { label: "Users", href: "/app/admin/users" },
          { label: user.name, href: `/app/admin/users/${userId}` },
          { label: "Edit" },
        ]}
      />

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Email address cannot be changed. To change email, delete and recreate the user.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* User Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>Edit user information and role assignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: "" })
                    }
                  }}
                  placeholder="John Doe"
                  className={validationErrors.name ? "border-destructive" : ""}
                />
                {validationErrors.name && <p className="text-sm text-destructive">{validationErrors.name}</p>}
              </div>

              {/* Email Field (Disabled) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user.email} disabled className="bg-muted opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full system access</SelectItem>
                    <SelectItem value="pm">Project Manager - Project management</SelectItem>
                    <SelectItem value="ba">Business Analyst - Requirements management</SelectItem>
                    <SelectItem value="qa">QA Engineer - Testing focus</SelectItem>
                    <SelectItem value="developer">Developer - Development focus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as UserStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active - User can access the system</SelectItem>
                    <SelectItem value="inactive">Inactive - User cannot access the system</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-6 border-t">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                {hasChanges && (
                  <Button variant="outline" onClick={handleReset} disabled={saving}>
                    Reset
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Changes Summary */}
          {hasChanges && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Unsaved Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {formData.name !== originalData.name && (
                  <div>
                    <p className="text-muted-foreground">Name updated</p>
                    <p className="text-xs">
                      {originalData.name} → {formData.name}
                    </p>
                  </div>
                )}
                {formData.role !== originalData.role && (
                  <div>
                    <p className="text-muted-foreground">Role changed</p>
                    <p className="text-xs">
                      {userUtils.getRoleLabel(originalData.role)} → {userUtils.getRoleLabel(formData.role)}
                    </p>
                  </div>
                )}
                {formData.status !== originalData.status && (
                  <div>
                    <p className="text-muted-foreground">Status changed</p>
                    <p className="text-xs">
                      {userUtils.getStatusLabel(originalData.status)} → {userUtils.getStatusLabel(formData.status)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">User ID</p>
                <p className="font-mono bg-muted px-2 py-1 rounded text-xs">{user.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Current Status</p>
                <p className="capitalize">{user.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
