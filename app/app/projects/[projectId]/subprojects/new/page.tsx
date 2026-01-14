"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Plus } from "lucide-react"
import { useProjectStore, useUserManagementStore } from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function NewSubProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { projects, addProject } = useProjectStore()
  const { users } = useUserManagementStore()

  const parentProject = projects.find((p) => p.id === projectId)
  const [createMode, setCreateMode] = useState<"create" | "clone">("create")
  const [selectedCloneProject, setSelectedCloneProject] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.managerId) {
      alert("Please fill in all required fields")
      return
    }

    const newProject = {
      id: `proj-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      workspaceId: parentProject?.workspaceId || "ws-1",
      parentProjectId: projectId,
      status: "active" as const,
      managerId: formData.managerId,
      teamIds: [formData.managerId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addProject(newProject)
    router.push(`/app/projects/${projectId}`)
  }

  const pmUsers = users.filter((u) => u.role === "pm" && u.status === "active")

  if (!parentProject) {
    return <div>Project not found</div>
  }

  return (
    <div>
      <PageHeader
        title="Create Sub Project"
        description={`Create a new sub project under ${parentProject.name}`}
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: parentProject.name, href: `/app/projects/${projectId}` },
          { label: "New Sub Project" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Creation Mode</CardTitle>
            <CardDescription>Choose how to create the sub project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  createMode === "create" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => setCreateMode("create")}
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Create New</p>
                    <p className="text-sm text-muted-foreground">Create a blank sub project</p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  createMode === "clone" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => setCreateMode("clone")}
              >
                <div className="flex items-center gap-3">
                  <Copy className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Clone Project</p>
                    <p className="text-sm text-muted-foreground">Clone from existing project</p>
                  </div>
                </div>
              </div>
            </div>

            {createMode === "clone" && (
              <div className="mt-6 space-y-3 pt-6 border-t">
                <Label>Select Project to Clone</Label>
                <RadioGroup value={selectedCloneProject} onValueChange={setSelectedCloneProject}>
                  {projects
                    .filter((p) => p.id !== projectId && p.workspaceId === parentProject.workspaceId)
                    .map((project) => (
                      <div key={project.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                        <RadioGroupItem value={project.id} id={project.id} />
                        <Label htmlFor={project.id} className="cursor-pointer flex-1">
                          {project.name}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sub Project Details</CardTitle>
            <CardDescription>Enter the sub project information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Sub Project Name *</Label>
                <Input
                  id="name"
                  placeholder={
                    createMode === "clone" ? "e.g., Frontend Development - v2" : "e.g., Frontend Development"
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter sub project description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Project Manager *</Label>
                <RadioGroup
                  value={formData.managerId}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                >
                  <div className="space-y-2">
                    {pmUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded border">
                        <RadioGroupItem value={user.id} id={`manager-${user.id}`} />
                        <Label htmlFor={`manager-${user.id}`} className="cursor-pointer flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">Create Sub Project</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/app/projects/${projectId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
