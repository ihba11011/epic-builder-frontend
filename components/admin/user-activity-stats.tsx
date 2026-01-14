"use client"

import type { AuditLog } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { activity Utils } from "@/lib/utils/activity-utils"
import { Plus, Edit3, Trash2, Activity } from "lucide-react"

interface UserActivityStatsProps {
  activities: AuditLog[]
}

export default function UserActivityStats({ activities }: UserActivityStatsProps) {
  const stats = activityUtils.getActivityStats(activities)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Actions</p>
            <p className="text-2xl font-bold mt-2">{stats.totalActions}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Plus className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-2xl font-bold mt-2">{stats.createdCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Edit3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Updated</p>
            <p className="text-2xl font-bold mt-2">{stats.updatedCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Trash2 className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Deleted</p>
            <p className="text-2xl font-bold mt-2">{stats.deletedCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
