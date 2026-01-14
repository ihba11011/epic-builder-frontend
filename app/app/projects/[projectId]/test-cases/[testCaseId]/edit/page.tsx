"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTestStore, useStoryStore, useProjectStore, useAuthStore } from "@/lib/store"
import { testService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import type { TestCase } from "@/lib/types"
import { toast } from "sonner"

export default function TestCaseEditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const testCaseId = params.testCaseId as string
  const { testCases, updateTestCase } = useTestStore()
  const { stories } = useStoryStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    preconditions: "",
    steps: "",
    expectedResult: "",
    priority: "medium" as TestCase["priority"],
    status: "draft" as TestCase["status"],
    linkedStoryId: "none",
    testData: "",
  })

  useEffect(() => {
    loadData()
  }, [testCaseId, testCases, stories])

  const loadData = async () => {
    setLoading(true)
    try {
      const tc = testCases.find((t) => t.id === testCaseId)
      if (!tc) {
        const fetchedTC = await testService.getCase(testCaseId)
        setTestCase(fetchedTC || null)
        if (fetchedTC) {
          setFormData({
            title: fetchedTC.title,
            description: fetchedTC.description || "",
            preconditions: fetchedTC.preconditions || "",
            steps: fetchedTC.steps.map((s) => s.action).join("\n"),
            expectedResult: fetchedTC.expectedResult,
            priority: fetchedTC.priority,
            status: fetchedTC.status,
            linkedStoryId: fetchedTC.linkedStoryId || "none",
            testData: fetchedTC.testData || "",
          })
        }
      } else {
        setTestCase(tc)
        setFormData({
          title: tc.title,
          description: tc.description || "",
          preconditions: tc.preconditions || "",
          steps: tc.steps.map((s) => s.action).join("\n"),
          expectedResult: tc.expectedResult,
          priority: tc.priority,
          status: tc.status,
          linkedStoryId: tc.linkedStoryId || "none",
          testData: tc.testData || "",
        })
      }
    } catch (error) {
      toast.error("Failed to load test case")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a test case title")
      return
    }

    setSaving(true)
    try {
      const stepActions = formData.steps.split("\n").filter((s) => s.trim())
      const updated = await testService.updateCase(testCaseId, {
        title: formData.title,
        description: formData.description,
        preconditions: formData.preconditions,
        steps: stepActions.map((action, index) => ({
          id: `s${index + 1}`,
          order: index + 1,
          action,
          expectedResult: "Step completed",
        })),
        expectedResult: formData.expectedResult,
        priority: formData.priority,
        status: formData.status,
        linkedStoryId: formData.linkedStoryId === "none" ? undefined : formData.linkedStoryId,
        testData: formData.testData,
      })
      updateTestCase(testCaseId, updated)
      toast.success("Test case saved successfully")
      router.push(`/app/projects/${projectId}/test-cases/${testCaseId}`)
    } catch (error) {
      toast.error("Failed to save test case")
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

  if (!testCase) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Test case not found</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Test Case</h1>
          <p className="text-muted-foreground">Make changes to your test case</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter test case title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Test case description..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preconditions">Preconditions</Label>
                <Textarea
                  id="preconditions"
                  value={formData.preconditions}
                  onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                  placeholder="Prerequisites for test execution..."
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="steps">Test Steps</Label>
                <Textarea
                  id="steps"
                  value={formData.steps}
                  onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  placeholder="Enter each step on a new line..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Enter each test step on a new line</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expected">Expected Result</Label>
                <Textarea
                  id="expected"
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  placeholder="Expected outcome..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Case Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: TestCase["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: TestCase["priority"]) => setFormData({ ...formData, priority: value })}
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
                <Label htmlFor="linkedStory">Linked User Story</Label>
                <Select
                  value={formData.linkedStoryId}
                  onValueChange={(value) => setFormData({ ...formData, linkedStoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user story" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {stories.map((story) => (
                      <SelectItem key={story.id} value={story.id}>
                        {story.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="testData">Test Data</Label>
                <Input
                  id="testData"
                  value={formData.testData}
                  onChange={(e) => setFormData({ ...formData, testData: e.target.value })}
                  placeholder="Test data sets or fixtures"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
