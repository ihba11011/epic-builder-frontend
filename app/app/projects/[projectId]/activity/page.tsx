"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Clock,
  FileText,
  BookOpen,
  TestTube2,
  Users,
  Filter,
  X,
  Search,
  ArrowUpDown,
  Calendar,
  Download,
} from "lucide-react"
import { useProjectStore, useAuditStore } from "@/lib/store"
import { auditService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import PaginationCard from "@/components/admin/pagination-card"

const ACTIVITY_MODULES = [
  { value: "document", label: "Documents", icon: FileText, color: "bg-blue-500/20 text-blue-500" },
  { value: "story", label: "Stories", icon: BookOpen, color: "bg-purple-500/20 text-purple-500" },
  { value: "testcase", label: "Test Cases", icon: TestTube2, color: "bg-green-500/20 text-green-500" },
  { value: "project", label: "Project", icon: Users, color: "bg-orange-500/20 text-orange-500" },
  { value: "testrun", label: "Test Run", icon: TestTube2, color: "bg-cyan-500/20 text-cyan-500" },
]

const ACTIVITY_ACTIONS = [
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

const getActivityIcon = (module: string) => {
  const mod = ACTIVITY_MODULES.find((m) => m.value === module.toLowerCase())
  return mod?.icon || Clock
}

const getModuleColor = (module: string) => {
  const mod = ACTIVITY_MODULES.find((m) => m.value === module.toLowerCase())
  return mod?.color || "bg-gray-500/20 text-gray-500"
}

export default function ProjectActivityPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { projects } = useProjectStore()
  const { auditLogs, setAuditLogs } = useAuditStore()

  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" })

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    const loadData = async () => {
      try {
        const logs = await auditService.list({ projectId })
        setAuditLogs(logs)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [projectId, setAuditLogs])

  const projectLogs = auditLogs.filter((l) => l.projectId === projectId)

  const filteredLogs = projectLogs.filter((log) => {
    const matchesSearch =
      log.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesModule = !selectedModule || log.module.toLowerCase() === selectedModule.toLowerCase()
    const matchesAction = !selectedAction || log.action.toLowerCase() === selectedAction.toLowerCase()

    let matchesDateRange = true
    if (dateRange.from || dateRange.to) {
      const logDate = new Date(log.createdAt).getTime()
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from).getTime()
        matchesDateRange = matchesDateRange && logDate >= fromDate
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        matchesDateRange = matchesDateRange && logDate <= toDate.getTime()
      }
    }

    return matchesSearch && matchesModule && matchesAction && matchesDateRange
  })

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage)
  const paginatedLogs = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    const headers = ["Resource", "Module", "Action", "Date", "Changes"]
    const rows = sortedLogs.map((log) => [
      log.resourceName,
      log.module,
      log.action,
      new Date(log.createdAt).toLocaleString(),
      Object.entries(log.changes)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; "),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedModule(null)
    setSelectedAction(null)
    setCurrentPage(1)
    setSortOrder("desc")
    setDateRange({ from: "", to: "" })
  }

  const hasActiveFilters =
    searchQuery || selectedModule || selectedAction || sortOrder !== "desc" || dateRange.from || dateRange.to

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Activity"
          breadcrumbs={[
            { label: "Projects", href: "/app/projects" },
            { label: project?.name || "Project", href: `/app/projects/${projectId}` },
            { label: "Activity" },
          ]}
        />
        <DataTableSkeleton columns={5} rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description={`Activity log for ${project?.name} (${projectLogs.length} total entries)`}
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: project?.name || "Project", href: `/app/projects/${projectId}` },
          { label: "Activity" },
        ]}
        actions={
          sortedLogs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )
        }
      />

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by resource name, action, or module..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-2 bg-transparent">
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From date"
                    value={dateRange.from}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, from: e.target.value })
                      setCurrentPage(1)
                    }}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    placeholder="To date"
                    value={dateRange.to}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, to: e.target.value })
                      setCurrentPage(1)
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <Filter className="h-3 w-3" />
                  Module
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_MODULES.map((mod) => (
                    <Button
                      key={mod.value}
                      variant={selectedModule === mod.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedModule(selectedModule === mod.value ? null : mod.value)
                        setCurrentPage(1)
                      }}
                      className="text-xs"
                    >
                      <mod.icon className="h-3 w-3 mr-1" />
                      {mod.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <Filter className="h-3 w-3" />
                  Action
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_ACTIONS.map((action) => (
                    <Button
                      key={action.value}
                      variant={selectedAction === action.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedAction(selectedAction === action.value ? null : action.value)
                        setCurrentPage(1)
                      }}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="gap-2 text-xs"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {projectLogs.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No activity yet"
          description="Activities will appear here as changes are made to this project."
        />
      ) : filteredLogs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold">No activities match your filters</h3>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filter criteria</p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 bg-transparent">
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Changes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => {
                    const Icon = getActivityIcon(log.module)
                    const colorClass = getModuleColor(log.module)
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", colorClass)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{log.resourceName}</p>
                              <p className="text-xs text-muted-foreground">ID: {log.resourceId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm capitalize font-medium">{log.module}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-muted-foreground max-w-xs truncate">
                            {Object.entries(log.changes)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ") || "No changes"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm whitespace-nowrap">
                            <p className="text-foreground font-medium">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <PaginationCard
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage)
                setCurrentPage(1)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
