"use client"

import type { User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UserAvatar from "./user-avatar"
import RoleBadge from "./role-badge"
import StatusBadge from "./status-badge"
import { Mail, Calendar, ArrowRight } from "lucide-react"

interface UserCardProps {
  user: User
  onView?: () => void
  onEdit?: () => void
  className?: string
}

export default function UserCard({ user, onView, onEdit, className = "" }: UserCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <UserAvatar name={user.name} size="md" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{user.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Created</p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Workspaces</p>
            <p className="font-medium mt-1">{user.workspaceIds.length}</p>
          </div>
        </div>

        {(onView || onEdit) && (
          <div className="flex gap-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={onView} className="flex-1 bg-transparent">
                View
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={onEdit} className="flex-1">
                Edit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
