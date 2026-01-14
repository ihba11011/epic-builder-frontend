"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useDocumentStore, useProjectStore, useAuthStore } from "@/lib/store"
import { docService, aiService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Document } from "@/lib/types"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { PaginationCard } from "@/components/admin/pagination-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  RotateCcw,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react"
import { format } from "date-fns"

const categoryColors: Record<string, string> = {
  PRD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SRS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  BRD: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Wireframes: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  APIs: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  Notes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "—"
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  return `${(bytes / 1024).toFixed(2)} KB`
}

export default function DocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { documents, setDocuments, addDocument, updateDocument } = useDocumentStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [newDoc, setNewDoc] = useState({
    name: "",
    category: "PRD" as const,
    content: "",
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".json",
    ".xml",
  ]
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/json",
    "application/xml",
    "text/xml",
  ]

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }

    // Check file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext))
    if (!hasValidExtension) {
      return `File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "File MIME type not supported"
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      setUploadedFile(null)
      return
    }

    setUploadError("")
    setUploadedFile(file)
    setNewDoc({ ...newDoc, content: `File: ${file.name} (${(file.size / 1024).toFixed(2)}KB)` })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleImportDocuments = async (file: File) => {
    if (!file) return

    setIsProcessing(true)
    try {
      const text = await file.text()
      let importedDocs: Document[] = []

      if (file.name.endsWith(".csv")) {
        // Parse CSV
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim())

        importedDocs = lines.slice(1).map((line, index) => {
          const values = line.split(",").map((v) => v.trim())
          const doc: Document = {
            id: `doc-import-${Date.now()}-${index}`,
            projectId,
            name: values[1] || `Imported Document ${index + 1}`,
            category: (values[2] || "Notes") as any,
            content: `Imported: ${values[1]}`,
            fileType: "text/plain",
            status: "draft",
            ragStatus: "pending",
            versions: [
              {
                id: `v-import-${index}`,
                version: 1,
                content: `Imported: ${values[1]}`,
                createdAt: new Date().toISOString(),
                createdBy: user?.id || "user-1",
              },
            ],
            uploadedBy: user?.id || "user-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          return doc
        })
      } else if (file.name.endsWith(".json")) {
        // Parse JSON
        const parsed = JSON.parse(text)
        importedDocs = Array.isArray(parsed) ? parsed : [parsed]
      }

      // Add imported documents to store
      importedDocs.forEach((doc) => {
        addDocument(doc)
      })

      toast.success(`Successfully imported ${importedDocs.length} documents`)
    } catch (error) {
      toast.error("Failed to import documents. Please check the file format.")
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await docService.list(projectId)
        setDocuments(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadDocs()
  }, [projectId, setDocuments])

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || d.category === categoryFilter
    const matchesStatus = statusFilter === "all" || d.status === statusFilter

    let matchesDateRange = true
    if (dateFromFilter || dateToFilter) {
      const docDate = new Date(d.createdAt)
      if (dateFromFilter && docDate < new Date(dateFromFilter)) matchesDateRange = false
      if (dateToFilter && docDate > new Date(dateToFilter)) matchesDateRange = false
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDateRange
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, statusFilter, dateFromFilter, dateToFilter])

  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)

  const handleCreate = async () => {
    if (!newDoc.name.trim()) {
      toast.error("Please enter a document name")
      return
    }

    setIsProcessing(true)
    try {
      const doc = await docService.upload(projectId, {
        name: newDoc.name,
        category: newDoc.category,
        content: newDoc.content,
        uploadedBy: user?.id || "user-1",
        file: uploadedFile,
      })
      addDocument(doc)
      toast.success("Document created successfully")
      setShowCreateDialog(false)
      setNewDoc({ name: "", category: "PRD", content: "" })
      setUploadedFile(null)
    } catch {
      toast.error("Failed to create document")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDoc) return
    setIsProcessing(true)
    try {
      await docService.delete(selectedDoc.id)
      setDocuments(documents.filter((d) => d.id !== selectedDoc.id))
      toast.success("Document deleted successfully")
      setShowDeleteDialog(false)
      setSelectedDoc(null)
    } catch {
      toast.error("Failed to delete document")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = (doc: Document) => {
    const element = document.createElement("a")

    // Determine MIME type and extension from fileName or fileType
    let mimeType = doc.fileType || "text/plain"
    let extension = ".txt"

    if (doc.fileName) {
      const ext = doc.fileName.substring(doc.fileName.lastIndexOf(".")).toLowerCase()
      extension = ext

      // Map extensions to MIME types
      const mimeTypeMap: Record<string, string> = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".json": "application/json",
        ".xml": "application/xml",
      }

      mimeType = mimeTypeMap[ext] || "application/octet-stream"
    }

    const file = new Blob([doc.content], { type: mimeType })
    element.href = URL.createObjectURL(file)
    element.download = `${doc.name}${extension}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success(`Downloaded ${doc.name}${extension}`)
  }

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Category", "Status", "Created", "Updated"]
    const rows = filteredDocs.map((doc) => [
      doc.id,
      doc.name,
      doc.category,
      doc.status,
      format(new Date(doc.createdAt), "MMM d, yyyy"),
      format(new Date(doc.updatedAt), "MMM d, yyyy"),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const element = document.createElement("a")
    const file = new Blob([csvContent], { type: "text/csv" })
    element.href = URL.createObjectURL(file)
    element.download = `documents-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success("Documents exported successfully")
  }

  const handleResetFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
    setCurrentPage(1)
  }

  const handleGenerateStories = async (doc: Document) => {
    setIsProcessing(true)
    try {
      await aiService.generateStories({
        projectId,
        objective: doc.name,
        scope: "",
        personas: "",
        constraints: "",
        docIds: [doc.id],
      })
      toast.success("User stories generated successfully!")
      router.push(`/app/projects/${projectId}/user-stories`)
    } catch {
      toast.error("Failed to generate stories")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Manage project documents, requirements, and specifications"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0]
                        if (file) handleImportDocuments(file)
                      }}
                    />
                    Import from CSV
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0]
                        if (file) handleImportDocuments(file)
                      }}
                    />
                    Import from JSON
                  </label>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const template = [
                      ["ID", "Name", "Category", "Status"],
                      ["doc-1", "My Document", "PRD", "draft"],
                    ]
                    const csv = template.map((row) => row.join(",")).join("\n")
                    const element = document.createElement("a")
                    element.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
                    element.download = "documents-template.csv"
                    document.body.appendChild(element)
                    element.click()
                    document.body.removeChild(element)
                  }}
                >
                  Download CSV Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {isLoading ? (
        <DataTableSkeleton columns={5} rows={5} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-semibold">Filters</h3>
                </div>
                {(search || categoryFilter !== "all" || statusFilter !== "all" || dateFromFilter || dateToFilter) && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="PRD">PRD</SelectItem>
                    <SelectItem value="SRS">SRS</SelectItem>
                    <SelectItem value="BRD">BRD</SelectItem>
                    <SelectItem value="Wireframes">Wireframes</SelectItem>
                    <SelectItem value="APIs">APIs</SelectItem>
                    <SelectItem value="Notes">Notes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export as CSV">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">From Date</Label>
                  <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">To Date</Label>
                  <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {paginatedDocs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents found"
              description={
                search || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Create your first document to get started"
              }
              action={
                !search && categoryFilter === "all" && statusFilter === "all" ? (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Document
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Card>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow>
                        <TableHead className="w-[35%] px-4 py-3 font-semibold text-sm">Name</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-sm">Category</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-sm">Size</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-sm">Status</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-sm">Created</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-sm">Updated</TableHead>
                        <TableHead className="text-right px-4 py-3 font-semibold text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDocs.map((doc, index) => (
                        <TableRow
                          key={doc.id}
                          className={`${index % 2 === 0 ? "" : "bg-muted/30"} hover:bg-muted/50 transition-colors`}
                        >
                          <TableCell className="px-4 py-3 font-medium">
                            <span className="truncate max-w-xs block" title={doc.name}>
                              {doc.name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className={categoryColors[doc.category]} variant="secondary">
                              {doc.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                            {formatFileSize(doc.fileSize)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className={statusColors[doc.status]}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(doc.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(doc.updatedAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDoc(doc)
                                    router.push(`/app/projects/${projectId}/documents/${doc.id}`)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDoc(doc)
                                    router.push(`/app/projects/${projectId}/documents/${doc.id}/edit`)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleGenerateStories(doc)} disabled={isProcessing}>
                                  {isProcessing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                  )}
                                  Generate Stories
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedDoc(doc)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <PaginationCard
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredDocs.length}
              />
            </>
          )}
        </motion.div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Document</DialogTitle>
            <DialogDescription>Add a new document to your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                placeholder="Enter document name"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newDoc.category} onValueChange={(v) => setNewDoc({ ...newDoc, category: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRD">Product Requirements (PRD)</SelectItem>
                  <SelectItem value="SRS">Software Requirements (SRS)</SelectItem>
                  <SelectItem value="BRD">Business Requirements (BRD)</SelectItem>
                  <SelectItem value="Wireframes">Wireframes</SelectItem>
                  <SelectItem value="APIs">APIs</SelectItem>
                  <SelectItem value="Notes">Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Document File (Optional)</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                    accept={ALLOWED_EXTENSIONS.join(",")}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div className="flex items-center justify-center space-x-2">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Drag and drop your file here or{" "}
                        <span className="text-blue-600 font-medium">click to browse</span>
                      </span>
                    </div>
                  </label>
                </div>

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {uploadError}
                    </p>
                  </div>
                )}

                {uploadedFile && !uploadError && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
                          <p className="text-xs text-green-600">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null)
                          setNewDoc({ ...newDoc, content: "" })
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2">
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-green-600 mt-1">{uploadProgress}% uploaded</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">Supported Formats:</p>
                  <p className="text-xs text-blue-600">
                    PDF, Word (doc/docx), Excel (xls/xlsx), PowerPoint (ppt/pptx), TXT, CSV, JSON, XML
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Maximum file size: 50MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Additional Content (Optional)</Label>
                <Textarea
                  id="content"
                  placeholder="Enter additional document content or notes..."
                  value={uploadedFile ? newDoc.content : newDoc.content}
                  onChange={(e) => {
                    if (!uploadedFile) {
                      setNewDoc({ ...newDoc, content: e.target.value })
                    }
                  }}
                  rows={4}
                  disabled={!!uploadedFile}
                />
                {uploadedFile && (
                  <p className="text-xs text-gray-500">Content field is auto-populated from uploaded file</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDoc?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
