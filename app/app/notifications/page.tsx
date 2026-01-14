"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, CheckCheck, Clock, AtSign, Settings, Trash2, Filter, X } from "lucide-react"
import { useNotificationStore } from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import PaginationCard from "@/components/admin/pagination-card"

const NOTIFICATION_TYPES = [
  { value: "mention", label: "Mentions", icon: AtSign, color: "bg-blue-500/20 text-blue-500" },
  { value: "approval", label: "Approvals", icon: CheckCheck, color: "bg-green-500/20 text-green-500" },
  { value: "assignment", label: "Assignments", icon: Bell, color: "bg-purple-500/20 text-purple-500" },
  { value: "comment", label: "Comments", icon: Bell, color: "bg-orange-500/20 text-orange-500" },
  { value: "system", label: "System", icon: Settings, color: "bg-gray-500/20 text-gray-500" },
]

const getNotificationIcon = (type: string) => {
  const notifType = NOTIFICATION_TYPES.find((t) => t.value === type)
  return notifType?.icon || Bell
}

const getNotificationColor = (type: string) => {
  const notifType = NOTIFICATION_TYPES.find((t) => t.value === type)
  return notifType?.color || "bg-blue-500/20 text-blue-500"
}

export default function NotificationsPage() {
  const {
    notifications,
    filteredNotifications,
    currentPage,
    itemsPerPage,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setCurrentPage,
    setItemsPerPage,
    filterNotifications,
    resetFilters,
    getPaginatedNotifications,
  } = useNotificationStore()

  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showUnread, setShowUnread] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized && notifications.length === 0) {
      // Store will be populated by layout/parent component
      setInitialized(true)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length
  const paginatedNotifications = getPaginatedNotifications()
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)

  const handleFilterChange = (type: string | null, unread: boolean) => {
    setSelectedType(type)
    setShowUnread(unread)
    filterNotifications({
      type: type || undefined,
      read: unread ? false : null,
    })
  }

  const handleResetFilters = () => {
    setSelectedType(null)
    setShowUnread(false)
    resetFilters()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        breadcrumbs={[{ label: "Notifications" }]}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead()}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )
        }
      />

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filter by Type</h3>
              {(selectedType || showUnread) && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="ml-auto h-8 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {NOTIFICATION_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(selectedType === type.value ? null : type.value, showUnread)}
                  className="text-xs"
                >
                  <type.icon className="h-3 w-3 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showUnread ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(selectedType, !showUnread)}
                className="text-xs"
              >
                Unread Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Check back later for updates."
        />
      ) : filteredNotifications.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold">No notifications match your filters</h3>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filter criteria</p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 bg-transparent">
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {paginatedNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type)
              const colorClass = getNotificationColor(notification.type)
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      "border-border/50 cursor-pointer hover:bg-accent/50 transition-colors group",
                      !notification.read && "border-primary/50 bg-primary/5",
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div
                          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", colorClass)}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              {!notification.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {totalPages > 1 && (
            <PaginationCard
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={notifications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </>
      )}
    </div>
  )
}
