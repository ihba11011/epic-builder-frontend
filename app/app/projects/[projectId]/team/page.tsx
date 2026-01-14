"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Plus, MoreHorizontal, UserMinus, Search, X } from "lucide-react"
import { useProjectStore, useAuditStore } from "@/lib/store"
import { projectService, userService, auditService } from "@/lib/services"
import type { User, ProjectMember, UserRole } from "@/lib/types"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import PaginationCard from "@/components/admin/pagination-card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function ProjectTeamPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { projects, projectMembers, setProjectMembers, addProjectMember, removeProjectMember } = useProjectStore()
  const { addAuditLog, addActivity } = useAuditStore()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all") // Updated default value
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null)
  const [newMember, setNewMember] = useState({ role: "", userId: "" })

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersData, usersData] = await Promise.all([projectService.getMembers(projectId), userService.list()])
        setProjectMembers(membersData)
        setUsers(usersData)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [projectId, setProjectMembers])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  const teamMembers = projectMembers
    .filter((m) => m.projectId === projectId)
    .map((m) => ({
      ...m,
      user: users.find((u) => u.id === m.userId),
    }))
    .filter((m) => m.user)

  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)

  const getAvailableUsersByRole = (role: string) => {
    return users.filter(
      (u) =>
        u.role === role &&
        !projectMembers.some((m) => m.userId === u.id && m.projectId === projectId) &&
        u.role !== "admin",
    )
  }

  const handleAddMember = async () => {
    try {
      const member = await projectService.addMember(projectId, newMember.userId, newMember.role as UserRole)
      addProjectMember(member)
      const user = users.find((u) => u.id === newMember.userId)

      const log = await auditService.append({
        workspaceId: "ws-1",
        projectId,
        userId: "user-1",
        userName: "Current User",
        action: "ADD_MEMBER",
        module: "Team",
        details: `Added ${user?.name} as ${newMember.role}`,
      })
      addAuditLog(log)

      toast.success("Member added", { description: `${user?.name} has been added to the team` })
      setAddDialogOpen(false)
      setNewMember({ role: "", userId: "" })
    } catch {
      toast.error("Failed to add member")
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember) return
    try {
      await projectService.removeMember(selectedMember.id)
      removeProjectMember(selectedMember.id)
      const user = users.find((u) => u.id === selectedMember.userId)

      const log = await auditService.append({
        workspaceId: "ws-1",
        projectId,
        userId: "user-1",
        userName: "Current User",
        action: "REMOVE_MEMBER",
        module: "Team",
        details: `Removed ${user?.name} from the team`,
      })
      addAuditLog(log)

      toast.success("Member removed", { description: `${user?.name} has been removed from the team` })
      setRemoveDialogOpen(false)
      setSelectedMember(null)
    } catch {
      toast.error("Failed to remove member")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "pm":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "ba":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "qa":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "developer":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Team"
          breadcrumbs={[
            { label: "Projects", href: "/app/projects" },
            { label: project?.name || "Project", href: `/app/projects/${projectId}` },
            { label: "Team" },
          ]}
        />
        <DataTableSkeleton columns={5} rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description={`Manage ${filteredMembers.length} team member${filteredMembers.length !== 1 ? "s" : ""} for ${project?.name}`}
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: project?.name || "Project", href: `/app/projects/${projectId}` },
          { label: "Team" },
        ]}
        actions={
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        }
      />

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="ba">Business Analyst</SelectItem>
                  <SelectItem value="qa">Quality Analyst</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
              {(search || roleFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("")
                    setRoleFilter("all")
                  }}
                  className="text-xs h-10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredMembers.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No team members found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 border-b">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold text-sm">Name</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm">Email</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm">Role</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-sm">Added</TableHead>
                  <TableHead className="text-right px-4 py-3 font-semibold text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member, index) => (
                  <TableRow
                    key={member.id}
                    className={`${index % 2 === 0 ? "" : "bg-muted/30"} hover:bg-muted/50 transition-colors`}
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {member.user?.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.user?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{member.user?.email}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={cn("capitalize", getRoleBadgeColor(member.role))} variant="secondary">
                        {member.role.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(member.addedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedMember(member)
                              setRemoveDialogOpen(true)
                            }}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 && (
            <PaginationCard
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredMembers.length}
            />
          )}
        </>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Select a role and then choose a user to add to the team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v, userId: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="ba">Business Analyst</SelectItem>
                  <SelectItem value="qa">Quality Analyst</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMember.role && (
              <div className="space-y-2">
                <label className="text-sm font-medium">User *</label>
                <Select value={newMember.userId} onValueChange={(v) => setNewMember({ ...newMember, userId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableUsersByRole(newMember.role).length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No available users for this role</div>
                    ) : (
                      getAvailableUsersByRole(newMember.role).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!newMember.userId || !newMember.role}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${users.find((u) => u.id === selectedMember?.userId)?.name} from the team? This action cannot be undone.`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleRemoveMember}
      />
    </div>
  )
}
