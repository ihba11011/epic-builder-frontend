"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDocumentStore, useProjectStore, useAuthStore } from "@/lib/store"
import { docService, aiService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Download, Sparkles, FileText, Clock, User, Loader2, History } from "lucide-react"
import type { Document } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

const categoryColors: Record<string, string> = {
  PRD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SRS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  BRD: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Wireframes: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  APIs: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  Notes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

export default function DocumentViewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const documentId = params.documentId as string
  const { documents } = useDocumentStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

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
      } else {
        setDocument(doc)
      }
    } catch (error) {
      toast.error("Failed to load document")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAIProcess = async () => {
    if (!document) return
    setIsProcessing(true)
    try {
      await aiService.generateStories({
        projectId,
        objective: document.name,
        scope: document.content,
        personas: "",
        constraints: "",
        docIds: [document.id],
      })
      toast.success("AI processing complete. User stories generated!")
      router.push(`/app/projects/${projectId}/user-stories`)
    } catch (error) {
      toast.error("AI processing failed")
      console.error(error)
    } finally {
      setIsProcessing(false)
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
        <Button onClick={() => router.push(`/app/projects/${projectId}/documents`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/app/projects/${projectId}/documents`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{document.name}</h1>
          <p className="text-muted-foreground">
            Last updated {format(new Date(document.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAIProcess} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Stories
          </Button>
          <Button onClick={() => router.push(`/app/projects/${projectId}/documents/${documentId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed overflow-auto max-h-96">
                  {document.content || "No content available"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Status</span>
                <Badge className={`mt-2 ${statusColors[document.status]}`}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Category</span>
                <Badge className={`mt-2 ${categoryColors[document.category]}`}>{document.category}</Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">RAG Status</span>
                <Badge variant="outline" className="mt-2">
                  {document.ragStatus}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Created
                </span>
                <span className="text-sm">{format(new Date(document.createdAt), "MMM d, yyyy")}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Uploaded By
                </span>
                <span className="text-sm">{document.uploadedBy}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Versions ({document.versions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.versions.length > 0 ? (
                <div className="space-y-2">
                  {document.versions
                    .slice()
                    .reverse()
                    .map((version, index) => (
                      <div key={version.id} className="flex items-center gap-3 text-sm p-2 rounded border">
                        <div className={`h-2 w-2 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground"}`} />
                        <div className="flex-1">
                          <p className="font-medium">v{version.version}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(version.createdAt), "MMM d")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No version history</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={handleAIProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
