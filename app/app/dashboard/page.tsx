"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  FolderKanban,
  FileText,
  BookOpen,
  TestTube2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { useAuthStore, useProjectStore, useStoryStore, useTestStore, useDocumentStore } from "@/lib/store"
import { projectService, storyService, testService, docService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { projects, setProjects } = useProjectStore()
  const { stories, setStories } = useStoryStore()
  const { testCases, setTestCases } = useTestStore()
  const { documents, setDocuments } = useDocumentStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, storiesData, testsData, docsData] = await Promise.all([
          projectService.list(),
          storyService.list("proj-1"),
          testService.listCases("proj-1"),
          docService.list("proj-1"),
        ])
        setProjects(projectsData)
        setStories(storiesData)
        setTestCases(testsData)
        setDocuments(docsData)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [setProjects, setStories, setTestCases, setDocuments])

  const activeProjects = projects.filter((p) => p.status === "active").length
  const approvedStories = stories.filter((s) => s.status === "approved" || s.status === "published").length
  const passedTests = testCases.filter((t) => t.status === "active").length
  const totalStories = stories.length
  const totalTests = testCases.length

  const recentActivity = [
    { id: 1, action: "Story approved", item: "User Login with 2FA", time: "2 hours ago", user: "Peter PM" },
    { id: 2, action: "Test case created", item: "Valid User Registration", time: "4 hours ago", user: "Quinn QA" },
    { id: 3, action: "Document uploaded", item: "API Documentation", time: "Yesterday", user: "David Dev" },
    { id: 4, action: "Project created", item: "Mobile Banking App", time: "2 days ago", user: "Alex Admin" },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "User"}`}
        description="Here's what's happening across your projects"
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Stats Grid */}
          <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Active Projects"
              value={activeProjects}
              description={`${projects.length} total projects`}
              icon={FolderKanban}
              color="bg-blue-500"
            />
            <StatsCard
              title="User Stories"
              value={totalStories}
              description={`${approvedStories} approved`}
              icon={BookOpen}
              color="bg-purple-500"
            />
            <StatsCard
              title="Test Cases"
              value={totalTests}
              description={`${passedTests} active`}
              icon={TestTube2}
              color="bg-green-500"
            />
            <StatsCard
              title="Documents"
              value={documents.length}
              description="Across all projects"
              icon={FileText}
              color="bg-orange-500"
            />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Projects Overview */}
            <motion.div variants={item} className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>Your most recent projects</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/app/projects">
                      View all <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects
                    .filter((p) => p.status === "active")
                    .slice(0, 3)
                    .map((project) => (
                      <Link key={project.id} href={`/app/projects/${project.id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FolderKanban className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{project.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {project.teamIds.slice(0, 3).map((_, i) => (
                                <Avatar key={i} className="h-7 w-7 border-2 border-background">
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {String.fromCharCode(65 + i)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <StatusBadge status={project.status} />
                          </div>
                        </div>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={item}>
              <Card className="border-border/50 h-full">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates across projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.action}</span>
                            <span className="text-muted-foreground"> - {activity.item}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user} · {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Progress & Insights */}
          <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
            {/* Sprint Progress */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Sprint Progress
                </CardTitle>
                <CardDescription>Current sprint completion status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stories Completed</span>
                    <span className="font-medium">
                      {approvedStories}/{totalStories}
                    </span>
                  </div>
                  <Progress value={totalStories > 0 ? (approvedStories / totalStories) * 100 : 0} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-3 rounded-xl bg-green-500/10">
                    <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-semibold">{approvedStories}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-500/10">
                    <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-semibold">{stories.filter((s) => s.status === "in-review").length}</p>
                    <p className="text-xs text-muted-foreground">In Review</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-orange-500/10">
                    <AlertTriangle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                    <p className="text-lg font-semibold">{stories.filter((s) => s.status === "draft").length}</p>
                    <p className="text-xs text-muted-foreground">Draft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  description: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardContent className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
