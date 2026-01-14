"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Upload, X } from "lucide-react"
import { docService } from "@/lib/services"

const ALLOWED_FORMATS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "json", "xml"]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const CATEGORIES = ["PRD", "SRS", "BRD", "Wireframes", "APIs", "Notes"] as const

interface FileUploadData {
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export default function NewDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const [formData, setFormData] = useState({
    name: "",
    category: "Notes" as (typeof CATEGORIES)[number],
    description: "",
  })

  const [uploadedFile, setUploadedFile] = useState<FileUploadData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    }

    // Check file type by extension
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split(".").pop() || ""

    if (!ALLOWED_FORMATS.includes(fileExtension)) {
      return `File type ".${fileExtension}" not allowed. Allowed formats: ${ALLOWED_FORMATS.join(", ")}`
    }

    // Additional validation for MIME type
    const allowedMimeTypes = [
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

    if (!allowedMimeTypes.includes(file.type) && file.type !== "") {
      return `MIME type "${file.type}" not supported`
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setUploadedFile({
        file,
        progress: 0,
        status: "error",
        error: validationError,
      })
      return
    }

    setUploadedFile({
      file,
      progress: 100,
      status: "success",
    })
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.file
      return newErrors
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Document name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Document name must be at least 3 characters"
    } else if (formData.name.length > 255) {
      newErrors.name = "Document name must not exceed 255 characters"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!uploadedFile?.file) {
      newErrors.file = "File is required"
    }

    if (uploadedFile?.status === "error") {
      newErrors.file = uploadedFile.error || "File validation failed"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm() || !uploadedFile?.file) return

    setIsSubmitting(true)
    setUploadedFile((prev) => (prev ? { ...prev, status: "uploading", progress: 30 } : null))

    try {
      // Simulate file reading
      const fileContent = await uploadedFile.file.text()
      setUploadedFile((prev) => (prev ? { ...prev, progress: 60 } : null))

      // Create document with file content
      await docService.upload(projectId, {
        name: formData.name.trim(),
        category: formData.category,
        content: fileContent,
        uploadedBy: "user-1", // This would come from auth context
      })

      setUploadedFile((prev) => (prev ? { ...prev, progress: 100, status: "success" } : null))

      // Redirect to documents list
      setTimeout(() => {
        router.push(`/projects/${projectId}/documents`)
      }, 500)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadedFile((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              error: error instanceof Error ? error.message : "Upload failed",
            }
          : null,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload New Document</h1>
        <p className="text-muted-foreground">Add project documents like PDFs, Word files, and spreadsheets</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Document Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter document name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              <p className="text-xs text-muted-foreground mt-1">{formData.name.length}/255 characters</p>
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, category: value as (typeof CATEGORIES)[number] }))
                  if (errors.category) setErrors((prev) => ({ ...prev, category: "" }))
                }}
              >
                <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes about this document"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/500 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload File</CardTitle>
            <CardDescription>
              Supported formats: PDF, Word, Excel, PowerPoint, TXT, CSV, JSON, XML (Max 50MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Select File *</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition">
                <input
                  type="file"
                  accept={ALLOWED_FORMATS.map((fmt) => `.${fmt}`).join(",")}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                  disabled={isSubmitting}
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {uploadedFile?.file ? "Click to change file" : "Click to select file"}
                  </p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                </label>
              </div>
              {errors.file && <p className="text-sm text-destructive mt-2">{errors.file}</p>}
            </div>

            {/* File Status */}
            {uploadedFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    {uploadedFile.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    )}
                    {uploadedFile.status === "uploading" && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)}MB
                      </p>
                    </div>
                  </div>
                  {uploadedFile.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {uploadedFile.status === "uploading" && (
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{uploadedFile.progress}%</p>
                  </div>
                )}

                {uploadedFile.status === "error" && uploadedFile.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadedFile.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* File Requirements */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <p className="font-medium mb-1">File Requirements:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Maximum file size: 50MB</li>
                  <li>Allowed formats: {ALLOWED_FORMATS.join(", ")}</li>
                  <li>Files are scanned for security before processing</li>
                  <li>Document content is indexed for search</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !uploadedFile?.file || uploadedFile.status === "error"}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
