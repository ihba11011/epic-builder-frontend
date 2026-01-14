"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Search, FolderKanban, MoreHorizontal, Archive, Users, Calendar } from "lucide-react"
import { useProjectStore, useUserManagementStore } from "@/lib/store"
import { projectService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaginationCard } from "@/components/admin/pagination-card"
import { toast } from "sonner"
import { useWorkspaceStore } from "@/lib/store"
import { ProjectBreadcrumb } from "@/components/admin/project-breadcrumb"

export default function ProjectsPage() {
  const { projects, setProjects, updateProject } = useProjectStore()
  const { users } = useUserManagementStore()
  const { currentWorkspace } = useWorkspaceStore()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectService.list()
        setProjects(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [setProjects])

  const filteredProjects = projects.filter((p) => {
    const matchesWorkspace = !currentWorkspace || p.workspaceId === currentWorkspace.id
    const matchesParent = selectedParentId ? p.parentProjectId === selectedParentId : !p.parentProjectId
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesWorkspace && matchesParent && matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, selectedParentId])

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "Unassigned"
    const manager = users.find((u) => u.id === managerId)
    return manager?.name || "Unknown"
  }

  const handleArchive = async (id: string) => {
    try {
      await projectService.archive(id)
      updateProject(id, { status: "archived" })
      toast.success("Project archived")
    } catch {
      toast.error("Failed to archive project")
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div>
      <PageHeader
        title={selectedParentId ? "Sub Projects" : "Projects"}
        description={selectedParentId ? "Manage sub projects" : "Manage your SDLC projects and track progress"}
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <div className="flex gap-2">
            {selectedParentId && (
              <Button variant="outline" onClick={() => setSelectedParentId(null)}>
                Back to Projects
              </Button>
            )}
            <Button asChild>
              <Link href={selectedParentId ? `/app/projects/${selectedParentId}/subprojects/new` : "/app/projects/new"}>
                <Plus className="mr-2 h-4 w-4" />
                {selectedParentId ? "New Sub Project" : "New Project"}
              </Link>
            </Button>
          </div>
        }
      />

      {selectedParentId && <ProjectBreadcrumb currentProjectId={selectedParentId} onNavigate={setSelectedParentId} />}

      {/* Filters - Always visible */}
      <Card className="mb-6 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <DataTableSkeleton columns={3} rows={5} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : selectedParentId
                ? "Create your first sub project"
                : "Create your first project to get started"
          }
          action={
            !(search || statusFilter !== "all") && (
              <Button asChild>
                <Link
                  href={selectedParentId ? `/app/projects/${selectedParentId}/subprojects/new` : "/app/projects/new"}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {selectedParentId ? "Create Sub Project" : "Create Project"}
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {paginatedProjects.map((project) => (
              <motion.div key={project.id} variants={item}>
                <Card className="border-border/50 hover:border-primary/50 transition-colors group h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Link href={`/app/projects/${project.id}`} className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <FolderKanban className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                            <StatusBadge status={project.status} className="mt-1" />
                          </div>
                        </div>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/projects/${project.id}`}>View Project</Link>
                          </DropdownMenuItem>
                          {projects.some((p) => p.parentProjectId === project.id) && (
                            <DropdownMenuItem onClick={() => setSelectedParentId(project.id)}>
                              View Sub Projects
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/app/projects/${project.id}/settings`}>Settings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleArchive(project.id)}
                            className="text-destructive"
                            disabled={project.status === "archived"}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="line-clamp-2 mb-4">{project.description}</CardDescription>

                    <div className="mb-4 p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Project Manager</p>
                      <p className="text-sm font-medium">{getManagerName(project.managerId)}</p>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.teamIds.length} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex -space-x-2 mt-4">
                      {project.teamIds.slice(0, 5).map((_, i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.teamIds.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border-2 border-background text-xs font-medium">
                          +{project.teamIds.length - 5}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <PaginationCard
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredProjects.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </>
      )}
    </div>
  )
}
