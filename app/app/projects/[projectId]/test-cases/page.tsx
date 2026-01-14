"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Filter, Download, X } from "lucide-react"
import { useTestStore, useProjectStore, useAuthStore } from "@/lib/store"
import { testService } from "@/lib/services"
import { toast } from "sonner"

// UI Component imports
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import PaginationCard from "@/components/admin/pagination-card"

// Icons
import { Plus, Eye, Edit, MoreHorizontal, TestTube2, Loader2 } from "lucide-react"

const ITEMS_PER_PAGE = 10

export default function TestCasesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { testCases, setTestCases, addTestCase } = useTestStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
  })

  useEffect(() => {
    const loadTests = async () => {
      try {
        const data = await testService.listCases(projectId)
        setTestCases(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadTests()
  }, [projectId, setTestCases])

  const filteredTests = testCases.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage)
  const paginatedTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, priorityFilter, statusFilter, itemsPerPage])

  const handleCreate = async () => {
    if (!newTest.title.trim()) {
      toast.error("Please enter a test case title")
      return
    }

    setIsProcessing(true)
    try {
      const testCase = await testService.createCase({
        projectId,
        suiteId: "default-suite",
        title: newTest.title,
        description: newTest.description,
        priority: newTest.priority as any,
        status: "draft",
        createdBy: user?.id || "user-1",
        preconditions: "",
        steps: [],
        expectedResult: "",
      })
      addTestCase(testCase)
      toast.success("Test case created successfully")
      setShowCreateDialog(false)
      setNewTest({ title: "", description: "", priority: "medium" })
    } catch {
      toast.error("Failed to create test case")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ["ID", "Title", "Description", "Status", "Priority", "Created By"].join(","),
      ...filteredTests.map((t) =>
        [t.id, `"${t.title}"`, `"${t.description || ""}"`, t.status, t.priority, t.createdBy].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `test-cases-${projectId}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Test cases exported successfully")
  }

  const handleResetFilters = () => {
    setSearch("")
    setPriorityFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const priorityBgMap: Record<string, string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  const statusBgMap: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    deprecated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Cases"
        description="Create and manage test cases for your project"
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: currentProject?.name || "Project", href: `/app/projects/${projectId}` },
          { label: "Test Cases" },
        ]}
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Test Case
          </Button>
        }
      />

      {isLoading ? (
        <DataTableSkeleton columns={5} rows={5} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Filter by Priority & Status</h3>
                  {(search || priorityFilter !== "all" || statusFilter !== "all") && (
                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="ml-auto h-8 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search test cases..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="w-full sm:w-auto bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {testCases.length === 0 ? (
            <EmptyState
              icon={TestTube2}
              title="No test cases"
              description="You're all set! Create your first test case to get started."
            />
          ) : filteredTests.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <TestTube2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold">No test cases match your filters</h3>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filter criteria</p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 bg-transparent">
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
                {paginatedTests.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-border/50 hover:border-primary/50 transition-colors group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Link href={`/app/projects/${projectId}/test-cases/${test.id}`}>
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                                {test.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{test.description}</p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Badge className={priorityBgMap[test.priority]}>
                                {test.priority.charAt(0).toUpperCase() + test.priority.slice(1)}
                              </Badge>
                              <Badge className={statusBgMap[test.status]}>
                                {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                              </Badge>
                              {test.steps.length > 0 && (
                                <Badge variant="outline">
                                  {test.steps.length} step{test.steps.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/app/projects/${projectId}/test-cases/${test.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/app/projects/${projectId}/test-cases/${test.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  totalItems={filteredTests.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
            <DialogDescription>Add a new test case to your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Test Case Title</Label>
              <Input
                id="title"
                placeholder="Enter test case title"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Test case description..."
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={newTest.priority} onValueChange={(v) => setNewTest({ ...newTest, priority: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Test Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
