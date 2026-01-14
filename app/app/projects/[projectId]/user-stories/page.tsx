"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  Download,
  X,
  Plus,
  BookOpen,
  MoreHorizontal,
  Eye,
  Edit,
  Loader2,
  Sparkles,
  Upload,
  ClipboardPaste,
  Check,
  FileDown,
} from "lucide-react"
import { useStoryStore, useProjectStore, useAuthStore } from "@/lib/store"
import { storyService, aiService } from "@/lib/services"
import { toast } from "sonner"
import type { UserStory } from "@/lib/types"

// UI Component imports
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function UserStoriesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { stories, setStories, addStory, updateStory } = useStoryStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showPasteDialog, setShowPasteDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Upload dialog state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadInstructions, setUploadInstructions] = useState("")

  // Paste dialog state
  const [pasteTitle, setPasteTitle] = useState("")
  const [pasteContent, setPasteContent] = useState("")
  const [pastePrompt, setPastePrompt] = useState("")

  // Create dialog state
  const [newStory, setNewStory] = useState({
    title: "",
    description: "",
    acceptanceCriteria: "",
    priority: "medium" as const,
  })

  useEffect(() => {
    const loadStories = async () => {
      try {
        const data = await storyService.list(projectId)
        setStories(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadStories()
  }, [projectId, setStories])

  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === "all" || s.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  const totalPages = Math.ceil(filteredStories.length / itemsPerPage)
  const paginatedStories = filteredStories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, priorityFilter, statusFilter, itemsPerPage])

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedStories.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedStories.map((s) => s.id)))
    }
  }

  const handleDownloadSelected = () => {
    if (selectedRows.size === 0) {
      toast.error("Please select at least one story")
      return
    }

    const selectedStories = filteredStories.filter((s) => selectedRows.has(s.id))
    const csv = [
      ["ID", "Title", "Description", "Status", "Priority", "Created By", "Test Cases"].join(","),
      ...selectedStories.map((s) =>
        [
          s.id,
          `"${s.title}"`,
          `"${s.description || ""}"`,
          s.status,
          s.priority,
          s.createdBy,
          s.linkedTestIds.length,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `user-stories-selected-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`Downloaded ${selectedRows.size} stories`)
    setSelectedRows(new Set())
  }

  const handleDownloadAll = () => {
    const csv = [
      ["ID", "Title", "Description", "Status", "Priority", "Created By", "Test Cases"].join(","),
      ...filteredStories.map((s) =>
        [
          s.id,
          `"${s.title}"`,
          `"${s.description || ""}"`,
          s.status,
          s.priority,
          s.createdBy,
          s.linkedTestIds.length,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `user-stories-all-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filteredStories.length} stories`)
  }

  const downloadTemplate = () => {
    const csv = `Title,Description,Priority,Status
"User Registration Form","As a new user I want to register...","high","draft"
"Login with Email","As a user I want to login...","high","draft"`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "user-stories-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Template downloaded")
  }

  const handleUploadStories = async () => {
    if (!uploadFile) {
      toast.error("Please select a file")
      return
    }

    setIsProcessing(true)
    try {
      const text = await uploadFile.text()
      const lines = text.split("\n").filter((l) => l.trim())

      // Parse CSV (simple parser)
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const stories = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
        const story = await storyService.create({
          projectId,
          title: values[headers.indexOf("title")] || `Story ${i}`,
          description: values[headers.indexOf("description")] || "",
          acceptanceCriteria: [],
          priority: (values[headers.indexOf("priority")] || "medium") as any,
          status: "draft",
          createdBy: user?.id || "user-1",
        })
        stories.push(story)
      }

      setStories([...stories, ...stories])
      toast.success(`Imported ${stories.length} stories`)
      setShowUploadDialog(false)
      setUploadFile(null)
      setUploadInstructions("")
    } catch (error) {
      toast.error("Failed to import stories")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePasteAndGenerate = async () => {
    if (!pasteTitle.trim()) {
      toast.error("Please enter a story title")
      return
    }

    setIsProcessing(true)
    try {
      const story = await storyService.create({
        projectId,
        title: pasteTitle,
        description: pasteContent,
        acceptanceCriteria: pastePrompt ? [pastePrompt] : [],
        priority: "medium",
        status: "draft",
        createdBy: user?.id || "user-1",
      })
      addStory(story)

      if (pastePrompt) {
        const testCases = await aiService.generateTests({ projectId, storyId: story.id })
        toast.success(`Story created and ${testCases.length} test cases generated!`)
        router.push(`/app/projects/${projectId}/test-cases`)
      } else {
        toast.success("User story created successfully")
      }

      setShowPasteDialog(false)
      setPasteTitle("")
      setPasteContent("")
      setPastePrompt("")
    } catch (error) {
      toast.error("Failed to create story")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreate = async () => {
    if (!newStory.title.trim()) {
      toast.error("Please enter a story title")
      return
    }

    setIsProcessing(true)
    try {
      const story = await storyService.create({
        projectId,
        title: newStory.title,
        description: newStory.description,
        acceptanceCriteria: newStory.acceptanceCriteria.split("\n").filter((c) => c.trim()),
        priority: newStory.priority as any,
        status: "draft",
        createdBy: user?.id || "user-1",
      })
      addStory(story)
      toast.success("User story created successfully")
      setShowCreateDialog(false)
      setNewStory({ title: "", description: "", acceptanceCriteria: "", priority: "medium" })
    } catch {
      toast.error("Failed to create user story")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateTests = async (story: UserStory) => {
    setIsProcessing(true)
    try {
      await aiService.generateTests({ projectId, storyId: story.id })
      toast.success("Test cases generated successfully!")
      router.push(`/app/projects/${projectId}/test-cases`)
    } catch {
      toast.error("Failed to generate test cases")
    } finally {
      setIsProcessing(false)
    }
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
    draft: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
    "in-review": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    published: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Stories"
        description="Manage and track user stories for your project"
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: currentProject?.name || "Project", href: `/app/projects/${projectId}` },
          { label: "User Stories" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Story
            </Button>
            <Button variant="outline" onClick={() => setShowPasteDialog(true)}>
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Paste User Story
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <DataTableSkeleton columns={7} rows={5} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Filter Card */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Filter & Actions</h3>
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
                      placeholder="Search stories..."
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
                      <SelectItem value="in-review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedRows.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleDownloadSelected}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download ({selectedRows.size})
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedRows(new Set())}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {selectedRows.size === 0 && (
                    <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          {stories.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No user stories"
              description="You're all set! Create your first user story to get started."
            />
          ) : filteredStories.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold">No user stories match your filters</h3>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filter criteria</p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 bg-transparent">
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12 px-4">
                          <Checkbox
                            checked={selectedRows.size === paginatedStories.length && paginatedStories.length > 0}
                            onChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="px-4 py-3">Story ID</TableHead>
                        <TableHead className="px-4 py-3">Story Name</TableHead>
                        <TableHead className="px-4 py-3">Created By</TableHead>
                        <TableHead className="px-4 py-3 text-right">Test Cases</TableHead>
                        <TableHead className="px-4 py-3 text-center">Priority</TableHead>
                        <TableHead className="px-4 py-3 text-center">Status</TableHead>
                        <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStories.map((story) => (
                        <TableRow key={story.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                          <TableCell className="px-4">
                            <Checkbox checked={selectedRows.has(story.id)} onChange={() => handleSelectRow(story.id)} />
                          </TableCell>
                          <TableCell className="px-4 py-3 font-mono text-sm text-muted-foreground">
                            {story.id}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Link href={`/app/projects/${projectId}/user-stories/${story.id}`}>
                              <span className="font-semibold hover:text-primary transition-colors truncate block max-w-xs">
                                {story.title}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-muted-foreground">{story.createdBy}</TableCell>
                          <TableCell className="px-4 py-3 text-right text-sm font-medium">
                            {story.linkedTestIds.length}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Badge className={`${priorityBgMap[story.priority]}`}>
                              {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Badge className={`${statusBgMap[story.status]}`}>
                              {story.status === "in-review"
                                ? "In Review"
                                : story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/projects/${projectId}/user-stories/${story.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/app/projects/${projectId}/user-stories/${story.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleGenerateTests(story)} disabled={isProcessing}>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate Tests
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <PaginationCard
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStories.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Upload Stories Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload User Stories</DialogTitle>
            <DialogDescription>Import user stories from CSV or XLSX file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Download Template</Label>
              <Button variant="outline" onClick={downloadTemplate} className="w-full justify-center bg-transparent">
                <FileDown className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Select File (CSV/XLSX, max 2MB)</Label>
              <div
                className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload file</p>
                <p className="text-xs text-muted-foreground">CSV or XLSX files up to 2MB</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("File must be less than 2MB")
                        return
                      }
                      setUploadFile(file)
                      toast.success(`File selected: ${file.name}`)
                    }
                  }}
                  className="hidden"
                />
              </div>
              {uploadFile && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-900 dark:text-green-300">{uploadFile.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Parsing Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Add any special instructions for parsing the file..."
                value={uploadInstructions}
                onChange={(e) => setUploadInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadStories} disabled={!uploadFile || isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Stories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paste User Story Dialog */}
      <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paste User Story</DialogTitle>
            <DialogDescription>Paste story content and optionally generate test cases</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Story Input */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Story Details</h3>
              <div className="space-y-2">
                <Label htmlFor="paste-title">Story Title</Label>
                <Input
                  id="paste-title"
                  placeholder="As a user, I want to..."
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paste-content">Story Content</Label>
                <Textarea
                  id="paste-content"
                  placeholder="Enter detailed story description..."
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  rows={8}
                />
              </div>
            </div>

            {/* AI Prompt Panel */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">AI Prompt Panel</h3>
              <div className="space-y-2">
                <Label htmlFor="paste-prompt">Prompt / Instructions</Label>
                <Textarea
                  id="paste-prompt"
                  placeholder="Provide instructions to guide AI in generating test cases. Leave empty to skip test generation."
                  value={pastePrompt}
                  onChange={(e) => setPastePrompt(e.target.value)}
                  rows={8}
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                />
                <p className="text-xs text-muted-foreground">
                  If you provide instructions, test cases will be automatically generated after creating the story.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasteAndGenerate} disabled={!pasteTitle.trim() || isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pastePrompt ? "Create & Generate Tests" : "Create Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create User Story</DialogTitle>
            <DialogDescription>Add a new user story to your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input
                id="title"
                placeholder="As a user, I want to..."
                value={newStory.title}
                onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the user story..."
                value={newStory.description}
                onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">Acceptance Criteria</Label>
              <Textarea
                id="criteria"
                placeholder="Enter each criterion on a new line..."
                value={newStory.acceptanceCriteria}
                onChange={(e) => setNewStory({ ...newStory, acceptanceCriteria: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={newStory.priority} onValueChange={(v) => setNewStory({ ...newStory, priority: v as any })}>
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
              Create Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
