"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban } from "lucide-react"
import { useProjectStore, useAuthStore, useUserManagementStore } from "@/lib/store"
import { projectService, userService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function NewProjectPage() {
  const router = useRouter()
  const { addProject } = useProjectStore()
  const { user } = useAuthStore()
  const { users, setUsers } = useUserManagementStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      const allUsers = await userService.list()
      setUsers(allUsers)
    }
    if (users.length === 0) {
      loadUsers()
    }
  }, [users, setUsers])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goals: "",
    managerId: "",
  })

  const pmUsers = users.filter((u) => u.role === "pm" && u.status === "active")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Please enter a project name")
      return
    }

    if (!formData.managerId) {
      toast.error("Please select a project manager")
      return
    }

    setIsLoading(true)
    try {
      const project = await projectService.create({
        name: formData.name,
        description: formData.description + (formData.goals ? `\n\nGoals: ${formData.goals}` : ""),
        workspaceId: "ws-1",
        managerId: formData.managerId,
        teamIds: [user?.id || ""].filter(Boolean),
      })
      addProject(project)
      toast.success("Project created!", { description: `${formData.name} is ready to go` })
      setTimeout(() => {
        router.push("/app/projects")
      }, 500)
    } catch {
      toast.error("Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Project"
        description="Set up a new SDLC project"
        breadcrumbs={[{ label: "Projects", href: "/app/projects" }, { label: "New Project" }]}
      />

      <div className="max-w-2xl">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Project Details
            </CardTitle>
            <CardDescription>Create a new project with basic information and assign a project manager</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="E-Commerce Platform v3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief overview of the project..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Goals (Optional)</Label>
                <Textarea
                  id="goals"
                  placeholder="Key objectives and success metrics..."
                  rows={2}
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Project Manager *</Label>
                {pmUsers.length > 0 ? (
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                  >
                    <SelectTrigger id="manager">
                      <SelectValue placeholder="Select a project manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmUsers.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          <div className="flex items-center gap-2">
                            <span>{pm.name}</span>
                            <span className="text-xs text-muted-foreground">({pm.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      No active project managers available. Please add project managers to your team first.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || pmUsers.length === 0}>
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
