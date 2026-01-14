"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTestStore, useProjectStore, useAuthStore } from "@/lib/store"
import { testService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, TestTube, CheckCircle, Link2, BookOpen, Play, Loader2 } from "lucide-react"
import type { TestCase } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  deprecated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

export default function TestCaseViewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const testCaseId = params.testCaseId as string
  const { testCases } = useTestStore()
  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()

  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [testCaseId, testCases])

  const loadData = async () => {
    setLoading(true)
    try {
      const tc = testCases.find((t) => t.id === testCaseId)
      if (!tc) {
        const fetchedTC = await testService.getCase(testCaseId)
        setTestCase(fetchedTC || null)
      } else {
        setTestCase(tc)
      }
    } catch (error) {
      toast.error("Failed to load test case")
      console.error(error)
    } finally {
      setLoading(false)
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
        <Button onClick={() => router.push(`/app/projects/${projectId}/test-cases`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Test Cases
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/app/projects/${projectId}/test-cases`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{testCase.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">ID: {testCase.id}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/app/projects/${projectId}/test-cases/${testCaseId}/edit`)}>
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
                <TestTube className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{testCase.description || "No description provided"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preconditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{testCase.preconditions || "No preconditions specified"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test Steps ({testCase.steps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testCase.steps.length > 0 ? (
                <ol className="space-y-4">
                  {testCase.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm font-medium">{step.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">Expected: {step.expectedResult}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No test steps defined</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Expected Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{testCase.expectedResult || "No expected result specified"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Status</span>
                <Badge className={`mt-2 ${statusColors[testCase.status]}`}>
                  {testCase.status.charAt(0).toUpperCase() + testCase.status.slice(1)}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Priority</span>
                <Badge className={`mt-2 ${priorityColors[testCase.priority]}`}>
                  {testCase.priority.charAt(0).toUpperCase() + testCase.priority.slice(1)}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Test Data</span>
                <p className="text-sm mt-2">{testCase.testData || "None specified"}</p>
              </div>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Created</span>
                <p className="text-sm mt-2">{format(new Date(testCase.createdAt), "MMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          {testCase.linkedStoryId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Linked Story
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/app/projects/${projectId}/user-stories/${testCase.linkedStoryId}`)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Story
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
