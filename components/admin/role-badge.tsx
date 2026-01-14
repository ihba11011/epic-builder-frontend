"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import type { UserRole } from "@/lib/types"
import { Shield, Briefcase, BarChart3, CheckCircle, Code } from "lucide-react"

interface RoleBadgeProps {
  role: UserRole
  className?: string
  showIcon?: boolean
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-700",
  pm: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  ba: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-700",
  qa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-700",
  developer:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700",
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  pm: "Project Manager",
  ba: "Business Analyst",
  qa: "QA Engineer",
  developer: "Developer",
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  pm: <Briefcase className="h-3 w-3" />,
  ba: <BarChart3 className="h-3 w-3" />,
  qa: <CheckCircle className="h-3 w-3" />,
  developer: <Code className="h-3 w-3" />,
}

export default function RoleBadge({ role, className = "", showIcon = false }: RoleBadgeProps) {
  return (
    <Badge variant="outline" className={`${roleColors[role]} ${className} flex items-center gap-1`}>
      {showIcon && roleIcons[role]}
      {roleLabels[role]}
    </Badge>
  )
}
