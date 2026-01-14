"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStoryStore, useTestStore, useProjectStore, useAuthStore } from "@/lib/store"
import { storyService, testService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Sparkles, BookOpen, CheckCircle, TestTube, Loader2 } from "lucide-react"
import type { UserStory, TestCase } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-review": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  published: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export default function UserStoryViewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const storyId = params.storyId as string
  const { stories } = useStoryStore()
  const { testCases } = useTestStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [story, setStory] = useState<UserStory | null>(null)
  const [linkedTestCases, setLinkedTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [storyId, stories, testCases])

  const loadData = async () => {
    setLoading(true)
    try {
      const storyData = stories.find((s) => s.id === storyId)
      if (!storyData) {
        const fetchedStory = await storyService.get(storyId)
        setStory(fetchedStory || null)
      } else {
        setStory(storyData)
      }

      const linked = testCases.filter((tc) => tc.linkedStoryId === storyId)
      setLinkedTestCases(linked)
    } catch (error) {
      toast.error("Failed to load user story")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTestCases = async () => {
    if (!story) return
    setIsProcessing(true)
    try {
      const generated = await testService.createCase({
        projectId,
        suiteId: "suite-default",
        title: `Test for: ${story.title}`,
        description: `Generated test cases for the story: ${story.title}`,
        priority: story.priority,
        status: "draft",
        createdBy: user?.id || "user-1",
        preconditions: "Story should be in approved or published status",
        steps: story.acceptanceCriteria.map((criteria, index) => ({
          id: `s${index + 1}`,
          order: index + 1,
          action: `Verify acceptance criteria: ${criteria}`,
          expectedResult: "Criteria satisfied",
        })),
        expectedResult: "All acceptance criteria are met",
      })
      toast.success("Test case generated successfully!")
      setLinkedTestCases([...linkedTestCases, generated])
    } catch (error) {
      toast.error("Failed to generate test cases")
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

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">User story not found</p>
        <Button onClick={() => router.push(`/app/projects/${projectId}/user-stories`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stories
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/app/projects/${projectId}/user-stories`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{story.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">ID: {story.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateTestCases} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Test Cases
          </Button>
          <Button onClick={() => router.push(`/app/projects/${projectId}/user-stories/${storyId}/edit`)}>
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
                <BookOpen className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{story.description || "No description provided"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Acceptance Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {story.acceptanceCriteria.length > 0 ? (
                <ul className="space-y-2">
                  {story.acceptanceCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{criterion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No acceptance criteria defined</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Linked Test Cases ({linkedTestCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linkedTestCases.length > 0 ? (
                <div className="space-y-2">
                  {linkedTestCases.map((tc) => (
                    <div
                      key={tc.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/app/projects/${projectId}/test-cases/${tc.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{tc.title}</span>
                      </div>
                      <Badge variant="outline">{tc.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No test cases linked yet</p>
                  <Button variant="outline" size="sm" onClick={handleGenerateTestCases} disabled={isProcessing}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Test Cases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Status</span>
                <Badge className={`mt-2 ${statusColors[story.status]}`}>
                  {story.status === "in-review"
                    ? "In Review"
                    : story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Priority</span>
                <Badge className={`mt-2 ${priorityColors[story.priority]}`}>
                  {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Story Points</span>
                <p className="text-sm font-medium mt-2">{story.storyPoints || "-"}</p>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Sprint</span>
                <p className="text-sm font-medium mt-2">{story.sprint || "Unassigned"}</p>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Created</span>
                <p className="text-sm mt-2">{format(new Date(story.createdAt), "MMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
