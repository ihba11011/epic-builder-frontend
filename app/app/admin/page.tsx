"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore, useUserManagementStore, useAuditStore } from "@/lib/store"
import { userService, auditService } from "@/lib/services"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Users, Shield, Activity, Settings } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

const statsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const statCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const menuVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

export default function AdminPage() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const { users, setUsers } = useUserManagementStore()
  const { auditLogs, setAuditLogs } = useAuditStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    if (currentUser.role !== "admin") {
      router.push("/app/403")
      return
    }

    loadData()
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, logsData] = await Promise.all([userService.list(), auditService.list({ workspaceId: "ws-1" })])
      setUsers(usersData)
      setAuditLogs(logsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalUsers: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    activeProjects: 12,
    recentLogs: auditLogs.slice(0, 5).length,
  }

  const adminSections = [
    {
      title: "User Management",
      description: "Invite, manage, and remove team members",
      href: "/app/admin/users",
      icon: Users,
      color: "bg-blue-100 dark:bg-blue-900",
      stat: `${stats.totalUsers} Members`,
    },
    {
      title: "Audit Logs",
      description: "View system activity and user actions",
      href: "/app/admin/audit-logs",
      icon: Activity,
      color: "bg-green-100 dark:bg-green-900",
      stat: `${stats.recentLogs} Recent`,
    },
    {
      title: "Workspace Settings",
      description: "Manage workspace configuration",
      href: "/app/admin/workspace",
      icon: Settings,
      color: "bg-purple-100 dark:bg-purple-900",
      stat: "Enterprise",
    },
  ]

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading Admin Dashboard</h2>
          <p className="text-muted-foreground">Please wait while we fetch your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, roles, permissions, and system settings"
        breadcrumbs={[{ label: "Admin" }]}
      />

      <motion.div
        variants={statsContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-4"
      >
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-100 dark:bg-blue-900" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "bg-red-100 dark:bg-red-900" },
          {
            label: "Active Projects",
            value: stats.activeProjects,
            icon: Activity,
            color: "bg-green-100 dark:bg-green-900",
          },
          { label: "Recent Logs", value: stats.recentLogs, icon: Settings, color: "bg-purple-100 dark:bg-purple-900" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={statCardVariants}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={menuVariants} initial="hidden" animate="visible" className="grid gap-6 md:grid-cols-2">
        {adminSections.map((section) => {
          const IconComponent = section.icon
          return (
            <motion.div key={section.href} variants={menuItemVariants}>
              <Link href={section.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{section.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                        </div>
                        <div className={`${section.color} p-3 rounded-lg flex-shrink-0`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm font-medium">{section.stat}</span>
                        <Button variant="ghost" size="sm">
                          Access
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
