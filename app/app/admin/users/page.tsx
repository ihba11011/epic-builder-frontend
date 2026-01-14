"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, useUserManagementStore } from "@/lib/store"
import { userService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2, AlertCircle, Users, Filter, X } from "lucide-react"
import { toast } from "sonner"
import UserManagementTable from "@/components/admin/user-management-table"
import FilterControls from "@/components/admin/filter-controls"
import PaginationCard from "@/components/admin/pagination-card"
import { userUtils } from "@/lib/utils/user-utils"

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const { users, setUsers, addUser } = useUserManagementStore()

  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState(users)

  const [inviteData, setInviteData] = useState({ email: "", role: "developer" as const })
  const [createData, setCreateData] = useState({
    name: "",
    email: "",
    role: "developer" as const,
  })

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role !== "admin") {
      router.push("/app/403")
      return
    }
    loadData()
  }, [currentUser])

  useEffect(() => {
    const filtered = userUtils.filterUsers(users, {
      search: searchQuery,
      role: roleFilter === "all" ? undefined : (roleFilter as any),
      status: statusFilter === "all" ? undefined : (statusFilter as any),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter, dateFrom, dateTo, users])

  const loadData = async () => {
    try {
      setLoading(true)
      const usersData = await userService.list()
      const activeUsers = usersData.filter((u) => u.status !== "deleted")
      setUsers(activeUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!userUtils.isValidEmail(inviteData.email.trim())) {
      toast.error("Please enter a valid email address")
      return
    }
    setIsProcessing(true)
    try {
      await userService.invite(inviteData.email, inviteData.role)
      toast.success("Invitation sent successfully")
      setShowInviteDialog(false)
      setInviteData({ email: "", role: "developer" })
    } catch (error) {
      console.error("Error inviting user:", error)
      toast.error("Failed to send invitation")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateUser = async () => {
    if (!createData.name.trim()) {
      toast.error("Please enter a name")
      return
    }
    if (!userUtils.isValidEmail(createData.email.trim())) {
      toast.error("Please enter a valid email address")
      return
    }
    setIsProcessing(true)
    try {
      const newUser = await userService.create({
        name: createData.name,
        email: createData.email,
        role: createData.role,
        status: "active",
        workspaceIds: [],
        assignedProjectIds: [],
      })
      addUser(newUser)
      toast.success("User created successfully")
      setShowCreateDialog(false)
      setCreateData({ name: "", email: "", role: "developer" })
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Failed to create user")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access user management.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading Users</h2>
          <p className="text-muted-foreground">Please wait while we fetch user data...</p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members, roles, and access"
        breadcrumbs={[{ label: "Admin", href: "/app/admin" }, { label: "Users" }]}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.status === "inactive").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters & Search</h3>
              {(searchQuery || roleFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="ml-auto h-8 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
            <FilterControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              onReset={handleResetFilters}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredUsers.length === 0
              ? "No Users Found"
              : `Showing ${paginatedUsers.length} of ${filteredUsers.length} users`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagementTable users={paginatedUsers} currentUserId={currentUser?.id || ""} />
        </CardContent>
      </Card>

      {filteredUsers.length > 0 && totalPages > 1 && (
        <PaginationCard
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage)
            setCurrentPage(1)
          }}
        />
      )}

      {/* Dialogs remain unchanged */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation to a new team member to join your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="ba">Business Analyst</SelectItem>
                  <SelectItem value="qa">QA Engineer</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account directly in the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                placeholder="John Doe"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email Address</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="john@company.com"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createData.role}
                onValueChange={(value) => setCreateData({ ...createData, role: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="ba">Business Analyst</SelectItem>
                  <SelectItem value="qa">QA Engineer</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
