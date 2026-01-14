"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { useProjectStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

interface ProjectBreadcrumbProps {
  currentProjectId?: string
  onNavigate?: (projectId: string | null) => void
}

export function ProjectBreadcrumb({ currentProjectId, onNavigate }: ProjectBreadcrumbProps) {
  const { projects } = useProjectStore()

  // Build breadcrumb path
  const getBreadcrumbPath = (projectId: string) => {
    const path: { id: string; name: string }[] = []
    let currentId: string | undefined = projectId

    while (currentId) {
      const project = projects.find((p) => p.id === currentId)
      if (!project) break
      path.unshift({ id: project.id, name: project.name })
      currentId = project.parentProjectId
    }

    return path
  }

  if (!currentProjectId) {
    return null
  }

  const breadcrumbs = getBreadcrumbPath(currentProjectId)

  return (
    <div className="flex items-center gap-1 py-2 px-3 bg-muted/50 rounded-lg mb-4 flex-wrap">
      <Link href="/app/projects">
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Home className="h-4 w-4" />
        </Button>
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-sm font-medium px-2 py-1">{crumb.name}</span>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => onNavigate?.(crumb.id)}>
              {crumb.name}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
