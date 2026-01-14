"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { User, UserStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal, Edit, Trash2, Shield, Eye, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { userService, auditService } from "@/lib/services"
import { useUserManagementStore } from "@/lib/store"
import UserAvatar from "./user-avatar"
import RoleBadge from "./role-badge"
import StatusBadge from "./status-badge"
import { dateUtils } from "@/lib/utils/date-utils"

interface UserManagementTableProps {
  users: User[]
  currentUserId: string
}

export default function UserManagementTable({ users, currentUserId }: UserManagementTableProps) {
  const router = useRouter()
  const { removeUser, updateUserStatus, updateUser } = useUserManagementStore()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusChangeUser, setStatusChangeUser] = useState<User | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<UserStatus | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const handleViewUser = (user: User) => {
    router.push(`/app/admin/users/${user.id}`)
  }

  const handleEditUser = (user: User) => {
    router.push(`/app/admin/users/${user.id}/edit`)
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    setIsDeleting(true)
    try {
      await userService.remove(selectedUser.id)
      removeUser(selectedUser.id)
      await auditService.append({
        workspaceId: "ws-1",
        userId: currentUserId,
        userName: "Current Admin",
        action: "DELETE_USER",
        module: "USER_MANAGEMENT",
        details: `Deleted user ${selectedUser.name} (${selectedUser.email})`,
      })
      toast.success("User removed successfully")
      setShowDeleteDialog(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error removing user:", error)
      toast.error("Failed to remove user")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = (user: User, newStatus: UserStatus) => {
    setStatusChangeUser(user)
    setStatusChangeTarget(newStatus)
    setShowStatusDialog(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!statusChangeUser || !statusChangeTarget) return
    setIsChangingStatus(true)
    try {
      const updated = await userService.update(statusChangeUser.id, { status: statusChangeTarget })
      updateUser(statusChangeUser.id, updated)
      await auditService.append({
        workspaceId: "ws-1",
        userId: currentUserId,
        userName: "Current Admin",
        action: "CHANGE_USER_STATUS",
        module: "USER_MANAGEMENT",
        details: `Changed user ${statusChangeUser.name} status from ${statusChangeUser.status} to ${statusChangeTarget}`,
      })
      toast.success(`User marked as ${statusChangeTarget}`)
      setShowStatusDialog(false)
      setStatusChangeUser(null)
      setStatusChangeTarget(null)
    } catch (error) {
      console.error("Error changing status:", error)
      toast.error("Failed to change user status")
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.name} size="sm" />
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              {currentUserId === user.id && <p className="text-xs text-primary font-semibold">(You)</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} showIcon />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dateUtils.formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              {user.status === "active" && currentUserId !== user.id && (
                                <DropdownMenuItem
                                  className="text-orange-600"
                                  onClick={() => handleStatusChange(user, "inactive")}
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Mark as Inactive
                                </DropdownMenuItem>
                              )}
                              {user.status === "inactive" && currentUserId !== user.id && (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => handleStatusChange(user, "active")}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Active
                                </DropdownMenuItem>
                              )}
                              {currentUserId !== user.id && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(user)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{selectedUser?.name}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark <span className="font-semibold">{statusChangeUser?.name}</span> as{" "}
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
