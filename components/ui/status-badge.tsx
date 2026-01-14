import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type StatusType =
  | "draft"
  | "in-review"
  | "approved"
  | "published"
  | "rejected"
  | "active"
  | "completed"
  | "archived"
  | "pending"
  | "pass"
  | "fail"
  | "blocked"
  | "skipped"
  | "in-progress"
  | "processing"
  | "ready"
  | "deprecated"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  "in-review": { label: "In Review", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  approved: { label: "Approved", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  published: { label: "Published", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  active: { label: "Active", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  completed: { label: "Completed", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  archived: { label: "Archived", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  pass: { label: "Pass", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  fail: { label: "Fail", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  blocked: { label: "Blocked", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  skipped: { label: "Skipped", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  "in-progress": { label: "In Progress", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  processing: { label: "Processing", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  ready: { label: "Ready", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  deprecated: { label: "Deprecated", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-500/20 text-gray-400 border-gray-500/30" }

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
