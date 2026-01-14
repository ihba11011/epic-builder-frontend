"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDocumentStore, useProjectStore, useAuthStore } from "@/lib/store"
import { docService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, Upload, X, CheckCircle2 } from "lucide-react"
import type { Document } from "@/lib/types"
import { toast } from "sonner"

const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/json": ".json",
  "application/xml": ".xml",
  "text/xml": ".xml",
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function DocumentEditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const documentId = params.documentId as string
  const { documents, updateDocument } = useDocumentStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    category: "PRD" as Document["category"],
    status: "draft" as Document["status"],
    content: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>("")

  useEffect(() => {
    loadDocument()
  }, [documentId, documents])

  const loadDocument = async () => {
    setLoading(true)
    try {
      const doc = documents.find((d) => d.id === documentId)
      if (!doc) {
        const fetchedDoc = await docService.get(documentId)
        setDocument(fetchedDoc || null)
        if (fetchedDoc) {
          setFormData({
            name: fetchedDoc.name,
            category: fetchedDoc.category,
            status: fetchedDoc.status,
            content: fetchedDoc.content || "",
          })
        }
      } else {
        setDocument(doc)
        setFormData({
          name: doc.name,
          category: doc.category,
          status: doc.status,
          content: doc.content || "",
        })
      }
    } catch (error) {
      toast.error("Failed to load document")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File): string => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
    }

    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      const ext = file.name.split(".").pop()
      return `File type .${ext} is not allowed. Supported: PDF, Word, Excel, PowerPoint, TXT, CSV, JSON, XML`
    }

    return ""
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setFileError(error)
      setSelectedFile(null)
      return
    }

    setFileError("")
    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) return

    setUploadingFile(true)
    try {
      const content = await selectedFile.text()

      // Update form data with file content
      setFormData((prev) => ({
        ...prev,
        content: content,
      }))

      // Update document with file metadata
      const updated = await docService.update(documentId, {
        name: formData.name,
        category: formData.category,
        status: formData.status,
        content: content,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      })

      updateDocument(documentId, updated)
      toast.success(`Document uploaded successfully (${(selectedFile.size / 1024).toFixed(2)}KB)`)
      setSelectedFile(null)
    } catch (error) {
      toast.error("Failed to upload document")
      console.error(error)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a document name")
      return
    }

    setSaving(true)
    try {
      const updated = await docService.update(documentId, {
        name: formData.name,
        category: formData.category,
        status: formData.status,
        content: formData.content,
      })
      updateDocument(documentId, updated)
      toast.success("Document saved successfully")
      router.push(`/app/projects/${projectId}/documents/${documentId}`)
    } catch (error) {
      toast.error("Failed to save document")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Document not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Document</h1>
          <p className="text-muted-foreground">Make changes to your document</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter document name"
                />
              </div>

              <div className="grid gap-2 border-t pt-4">
                <Label>Upload Document File</Label>
                <p className="text-xs text-muted-foreground">
                  Upload a PDF, Word, Excel, or PowerPoint file to replace document content
                </p>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  } ${fileError ? "border-destructive bg-destructive/5" : ""}`}
                >
                  <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml"
                    disabled={uploadingFile}
                  />

                  <label
                    htmlFor="file-input"
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    {!selectedFile ? (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drag and drop your file here</p>
                          <p className="text-xs text-muted-foreground">or click to browse</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-600">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)}KB</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {fileError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
                    {fileError}
                  </div>
                )}

                {selectedFile && !fileError && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUploadFile} disabled={uploadingFile} className="flex-1">
                      {uploadingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload and Replace
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null)
                        setFileError("")
                      }}
                      disabled={uploadingFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter document content..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: Document["category"]) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRD">PRD</SelectItem>
                    <SelectItem value="SRS">SRS</SelectItem>
                    <SelectItem value="BRD">BRD</SelectItem>
                    <SelectItem value="Wireframes">Wireframes</SelectItem>
                    <SelectItem value="APIs">APIs</SelectItem>
                    <SelectItem value="Notes">Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Document["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
