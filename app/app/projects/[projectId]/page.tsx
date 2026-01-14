"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText,
  BookOpen,
  TestTube2,
  Users,
  Activity,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
} from "lucide-react"
import { useProjectStore, useDocumentStore, useStoryStore, useTestStore, useUserManagementStore } from "@/lib/store"
import { projectService, docService, storyService, testService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProjectOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const { projects, currentProject, setCurrentProject } = useProjectStore()
  const { users } = useUserManagementStore()
  const { documents, setDocuments } = useDocumentStore()
  const { stories, setStories } = useStoryStore()
  const { testCases, setTestCases, testSuites, setTestSuites } = useTestStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [project, docs, storiesData, tests, suites] = await Promise.all([
          projectService.get(projectId),
          docService.list(projectId),
          storyService.list(projectId),
          testService.listCases(projectId),
          testService.listSuites(projectId),
        ])
        if (project) {
          setCurrentProject(project)
        }
        setDocuments(docs)
        setStories(storiesData)
        setTestCases(tests)
        setTestSuites(suites)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [projectId, setCurrentProject, setDocuments, setStories, setTestCases, setTestSuites])

  if (projectId === "new") {
    router.push("/app/projects/new")
    return null
  }

  const project = currentProject || projects.find((p) => p.id === projectId)

  if (isLoading) {
    return <ProjectOverviewSkeleton />
  }

  if (!project) {
    return <div>Project not found</div>
  }

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "Unassigned"
    const manager = users.find((u) => u.id === managerId)
    return manager?.name || "Unknown"
  }

  const totalTestCases = testCases.length
  const completedTests = testCases.filter((t) => t.status === "active").length
  const pendingTests = testCases.filter((t) => t.status === "draft").length
  const deprecatedTests = testCases.filter((t) => t.status === "deprecated").length
  const testCoveragePercent = totalTestCases > 0 ? Math.round((completedTests / totalTestCases) * 100) : 0

  const approvedStories = stories.filter((s) => s.status === "approved" || s.status === "published").length
  const activeTests = testCases.filter((t) => t.status === "active").length
  const linkedStories = stories.filter((s) => s.linkedTestIds.length > 0).length

  const quickLinks = [
    { label: "Documents", href: `/app/projects/${projectId}/documents`, icon: FileText, count: documents.length },
    { label: "User Stories", href: `/app/projects/${projectId}/user-stories`, icon: BookOpen, count: stories.length },
    { label: "Test Cases", href: `/app/projects/${projectId}/test-cases`, icon: TestTube2, count: testCases.length },
    { label: "Team", href: `/app/projects/${projectId}/team`, icon: Users, count: project.teamIds.length },
  ]

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description}
        breadcrumbs={
          project.parentProjectId
            ? [
                { label: "Projects", href: "/app/projects" },
                {
                  label: projects.find((p) => p.id === project.parentProjectId)?.name || "Parent",
                  href: `/app/projects/${project.parentProjectId}`,
                },
                { label: project.name },
              ]
            : [{ label: "Projects", href: "/app/projects" }, { label: project.name }]
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/app/projects/${projectId}/subprojects/new`}>
                <Sparkles className="mr-2 h-4 w-4" />
                New Sub Project
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/app/projects/${projectId}/activity`}>
                <Activity className="mr-2 h-4 w-4" />
                Activity
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="mb-6 border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Project Manager</p>
              <p className="text-xl font-semibold">{getManagerName(project.managerId)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Team Size</p>
              <p className="text-xl font-semibold">{project.teamIds.length} members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {quickLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                <Card className="border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <link.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{link.label}</h3>
                          {link.count !== null && <p className="text-sm text-muted-foreground">{link.count} items</p>}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Story Progress</CardTitle>
                <CardDescription>User story completion status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">
                      {approvedStories}/{stories.length} (
                      {stories.length > 0 ? Math.round((approvedStories / stories.length) * 100) : 0}%)
                    </span>
                  </div>
                  <Progress value={stories.length > 0 ? (approvedStories / stories.length) * 100 : 0} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                    <span className="font-bold text-purple-500">
                      {stories.filter((s) => s.status === "approved").length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">In Review</span>
                    </div>
                    <span className="font-bold text-blue-500">
                      {stories.filter((s) => s.status === "in-review").length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Draft</span>
                    </div>
                    <span className="font-bold text-yellow-500">
                      {stories.filter((s) => s.status === "draft").length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Published</span>
                    </div>
                    <span className="font-bold text-green-500">
                      {stories.filter((s) => s.status === "published").length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-sm font-medium">Total Stories</span>
                  <span className="font-bold">{stories.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Test Case Statistics</CardTitle>
                <CardDescription>Comprehensive test case status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Coverage</span>
                    <span className="font-medium">
                      {completedTests}/{totalTestCases} ({testCoveragePercent}%)
                    </span>
                  </div>
                  <Progress value={testCoveragePercent} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Completed (Active)</span>
                    </div>
                    <span className="font-bold text-green-500">{completedTests}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Pending (Draft)</span>
                    </div>
                    <span className="font-bold text-yellow-500">{pendingTests}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Deprecated</span>
                    </div>
                    <span className="font-bold text-orange-500">{deprecatedTests}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-sm font-medium">Total Test Cases</span>
                  <span className="font-bold">{totalTestCases}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProjectOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
