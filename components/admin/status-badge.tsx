"use client"

import { Badge } from "@/components/ui/badge"
import type { UserStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: UserStatus
  className?: string
}

const statusColors: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700",
  inactive:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-700",
}

const statusLabels: Record<UserStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  deleted: "Deleted",
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`${statusColors[status]} ${className}`}>
      {statusLabels[status]}
    </Badge>
  )
}
