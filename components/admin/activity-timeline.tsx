"use client"

import type { AuditLog } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { activityUtils } from "@/lib/utils/activity-utils"
import { dateUtils } from "@/lib/utils/date-utils"
import { Activity } from "lucide-react"

interface ActivityTimelineProps {
  activities: AuditLog[]
  limit?: number
}

export default function ActivityTimeline({ activities, limit = 10 }: ActivityTimelineProps) {
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  if (sortedActivities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No activities yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedActivities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${activityUtils.getActionBgColor(activity.action)}`}
                >
                  <Activity className={`h-5 w-5 ${activityUtils.getActionColor(activity.action)}`} />
                </div>
                {index !== sortedActivities.length - 1 && <div className="w-0.5 h-12 bg-border mt-2" />}
              </div>

              {/* Activity Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h4 className="font-semibold text-sm">{activityUtils.getActionLabel(activity.action)}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">by {activity.userName}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activityUtils.getModuleLabel(activity.module)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{activity.details}</p>
                <p className="text-xs text-muted-foreground mt-2">{dateUtils.formatDateTime(activity.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
