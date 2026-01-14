"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStoryStore, useProjectStore, useAuthStore } from "@/lib/store"
import { storyService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import type { UserStory } from "@/lib/types"
import { toast } from "sonner"

export default function UserStoryEditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const storyId = params.storyId as string
  const { stories, updateStory } = useStoryStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [story, setStory] = useState<UserStory | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    acceptanceCriteria: "",
    priority: "medium" as UserStory["priority"],
    status: "draft" as UserStory["status"],
    storyPoints: 0,
    sprint: "",
  })

  useEffect(() => {
    loadStory()
  }, [storyId, stories])

  const loadStory = async () => {
    setLoading(true)
    try {
      const storyData = stories.find((s) => s.id === storyId)
      if (!storyData) {
        const fetchedStory = await storyService.get(storyId)
        setStory(fetchedStory || null)
        if (fetchedStory) {
          setFormData({
            title: fetchedStory.title,
            description: fetchedStory.description || "",
            acceptanceCriteria: fetchedStory.acceptanceCriteria.join("\n"),
            priority: fetchedStory.priority,
            status: fetchedStory.status,
            storyPoints: fetchedStory.storyPoints || 0,
            sprint: fetchedStory.sprint || "",
          })
        }
      } else {
        setStory(storyData)
        setFormData({
          title: storyData.title,
          description: storyData.description || "",
          acceptanceCriteria: storyData.acceptanceCriteria.join("\n"),
          priority: storyData.priority,
          status: storyData.status,
          storyPoints: storyData.storyPoints || 0,
          sprint: storyData.sprint || "",
        })
      }
    } catch (error) {
      toast.error("Failed to load user story")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a story title")
      return
    }

    setSaving(true)
    try {
      const updated = await storyService.update(storyId, {
        title: formData.title,
        description: formData.description,
        acceptanceCriteria: formData.acceptanceCriteria.split("\n").filter((c) => c.trim()),
        priority: formData.priority,
        status: formData.status,
        storyPoints: formData.storyPoints,
        sprint: formData.sprint,
      })
      updateStory(storyId, updated)
      toast.success("User story saved successfully")
      router.push(`/app/projects/${projectId}/user-stories/${storyId}`)
    } catch (error) {
      toast.error("Failed to save user story")
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

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">User story not found</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Edit User Story</h1>
          <p className="text-muted-foreground">Make changes to your user story</p>
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
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Story Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="As a user, I want to..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the user story..."
                  rows={6}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="criteria">Acceptance Criteria</Label>
                <Textarea
                  id="criteria"
                  value={formData.acceptanceCriteria}
                  onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
                  placeholder="Enter each criterion on a new line..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Enter each acceptance criterion on a new line</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Story Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: UserStory["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: UserStory["priority"]) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="points">Story Points</Label>
                <Input
                  id="points"
                  type="number"
                  min={0}
                  value={formData.storyPoints}
                  onChange={(e) => setFormData({ ...formData, storyPoints: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sprint">Sprint</Label>
                <Input
                  id="sprint"
                  value={formData.sprint}
                  onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                  placeholder="e.g., Sprint 1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
