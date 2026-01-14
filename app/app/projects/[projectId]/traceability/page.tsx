"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { useProjectStore, useDocumentStore, useStoryStore, useTestStore } from "@/lib/store"
import { docService, storyService, testService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import {
  FileText,
  BookOpen,
  TestTube2,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link2,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const coverageColors = {
  full: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  none: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export default function TraceabilityPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { currentProject } = useProjectStore()
  const { documents, setDocuments } = useDocumentStore()
  const { stories, setStories } = useStoryStore()
  const { testCases, setTestCases } = useTestStore()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [coverageFilter, setCoverageFilter] = useState("all")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docs, storiesData, tests] = await Promise.all([
          docService.list(projectId),
          storyService.list(projectId),
          testService.listCases(projectId),
        ])
        setDocuments(docs)
        setStories(storiesData)
        setTestCases(tests)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [projectId, setDocuments, setStories, setTestCases])

  const getStoryCoverage = (storyId: string) => {
    const linkedTests = testCases.filter((t) => t.linkedStoryId === storyId)
    if (linkedTests.length === 0) return "none"
    const activeTests = linkedTests.filter((t) => t.status === "active").length
    if (activeTests === linkedTests.length) return "full"
    return "partial"
  }

  const stats = {
    totalDocuments: documents.length,
    totalStories: stories.length,
    totalTestCases: testCases.length,
    storiesWithTests: stories.filter((s) => testCases.some((t) => t.linkedStoryId === s.id)).length,
    activeTests: testCases.filter((t) => t.status === "active").length,
  }

  const coveragePercentage =
    stats.totalStories > 0 ? Math.round((stats.storiesWithTests / stats.totalStories) * 100) : 0

  const filteredStories = stories.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase())
    const coverage = getStoryCoverage(s.id)
    const matchesCoverage = coverageFilter === "all" || coverage === coverageFilter
    return matchesSearch && matchesCoverage
  })

  return (
    <div>
      <PageHeader
        title="Traceability Matrix"
        description="Track requirements coverage across documents, stories, and test cases"
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: currentProject?.name || "Project", href: `/app/projects/${projectId}` },
          { label: "Traceability" },
        ]}
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      {isLoading ? (
        <DataTableSkeleton columns={4} rows={6} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalStories}</p>
                    <p className="text-xs text-muted-foreground">User Stories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TestTube2 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalTestCases}</p>
                    <p className="text-xs text-muted-foreground">Test Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{coveragePercentage}%</p>
                    <p className="text-xs text-muted-foreground">Coverage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="stories" className="space-y-4">
            <TabsList>
              <TabsTrigger value="stories">By User Story</TabsTrigger>
              <TabsTrigger value="documents">By Document</TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={coverageFilter} onValueChange={setCoverageFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Coverage</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredStories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium">No stories found</h3>
                      <p className="text-muted-foreground mt-1">Create user stories to track traceability</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredStories.map((story) => {
                        const linkedTests = testCases.filter((t) => t.linkedStoryId === story.id)
                        const coverage = getStoryCoverage(story.id)
                        return (
                          <div
                            key={story.id}
                            className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <span className="font-medium">{story.title}</span>
                              </div>
                              <Badge className={coverageColors[coverage]}>
                                {coverage === "full" && <CheckCircle className="mr-1 h-3 w-3" />}
                                {coverage === "partial" && <AlertCircle className="mr-1 h-3 w-3" />}
                                {coverage === "none" && <XCircle className="mr-1 h-3 w-3" />}
                                {coverage.charAt(0).toUpperCase() + coverage.slice(1)}
                              </Badge>
                            </div>
                            {linkedTests.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {linkedTests.map((test) => (
                                  <Badge key={test.id} variant="outline" className="text-xs">
                                    <TestTube2 className="mr-1 h-3 w-3" />
                                    {test.title}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No test cases linked</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Traceability</CardTitle>
                  <CardDescription>View requirement flow from documents to stories and tests</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium">No documents</h3>
                      <p className="text-muted-foreground mt-1">Upload documents to track traceability</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {documents.map((doc) => {
                        const linkedStories = stories.filter((s) => s.linkedDocIds?.includes(doc.id))
                        return (
                          <div key={doc.id} className="p-4 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="font-medium text-lg">{doc.name}</span>
                            </div>
                            {linkedStories.length > 0 ? (
                              <div className="space-y-3 ml-6">
                                {linkedStories.map((story) => {
                                  const linkedTests = testCases.filter((t) => t.linkedStoryId === story.id)
                                  return (
                                    <div key={story.id} className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">→</span>
                                      <BookOpen className="h-4 w-4 text-blue-500" />
                                      <span>{story.title}</span>
                                      {linkedTests.length > 0 && (
                                        <>
                                          <span className="text-muted-foreground">→</span>
                                          <TestTube2 className="h-4 w-4 text-purple-500" />
                                          <span className="text-muted-foreground">{linkedTests.length} test(s)</span>
                                        </>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground ml-6">No stories linked</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  )
}
