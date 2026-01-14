"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Save, Trash2, AlertTriangle } from "lucide-react"
import { useProjectStore } from "@/lib/store"
import { projectService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { projects, updateProject } = useProjectStore()
  const project = projects.find((p) => p.id === projectId)

  const [name, setName] = useState(project?.name || "")
  const [description, setDescription] = useState(project?.description || "")
  const [status, setStatus] = useState(project?.status || "active")
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await projectService.update(projectId, { name, description, status: status as any })
      updateProject(projectId, { name, description, status: status as any })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await projectService.archive(projectId)
      updateProject(projectId, { status: "archived" })
      toast.success("Project archived")
      router.push("/app/projects")
    } catch {
      toast.error("Failed to archive project")
    }
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description={`Configure settings for ${project.name}`}
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: project.name, href: `/app/projects/${projectId}` },
          { label: "Settings" },
        ]}
      />

      <div className="max-w-2xl space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic project information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div>
                <h4 className="font-medium">Archive Project</h4>
                <p className="text-sm text-muted-foreground">Archive this project and all its data</p>
              </div>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive Project"
        description={`Are you sure you want to archive "${project.name}"? The project will be moved to archived status.`}
        confirmText="Archive"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
