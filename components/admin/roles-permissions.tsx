"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Shield, FileText } from "lucide-react"

const rolePermissionsData = [
  {
    role: "admin",
    label: "Admin",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    description: "Full system access with complete control over all resources",
    permissions: {
      "User Management": ["Create", "Read", "Update", "Delete", "Invite"],
      "Project Management": ["Create", "Read", "Update", "Delete", "Archive"],
      "Content Management": ["Create", "Read", "Update", "Delete", "Publish"],
      "System Settings": ["Configure", "Manage Roles", "View Audit Logs", "Manage Workspaces"],
      Permissions: ["Assign Roles", "Modify Permissions", "Create Custom Roles"],
    },
  },
  {
    role: "sub-admin",
    label: "Sub-Admin",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    description: "Scoped administrative access within assigned projects",
    permissions: {
      "User Management": ["Read", "Invite to Project", "Update Role within Project"],
      "Project Management": ["Read", "Update Project Settings"],
      "Content Management": ["Create", "Read", "Update", "Publish"],
      "System Settings": ["View Audit Logs"],
      Permissions: ["Assign Roles within Project"],
    },
  },
  {
    role: "pm",
    label: "Project Manager",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    description: "Project and team management with oversight capabilities",
    permissions: {
      "Project Management": ["Create", "Read", "Update", "Archive"],
      "Team Management": ["Invite Members", "Assign Tasks", "View Progress"],
      "Content Management": ["Create", "Read", "Update"],
      Permissions: ["View Permissions"],
    },
  },
  {
    role: "ba",
    label: "Business Analyst",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    description: "Requirements and documentation management",
    permissions: {
      "Content Management": ["Create", "Read", "Update"],
      "Document Management": ["Upload", "Read", "Update", "Publish"],
      Permissions: ["View Permissions"],
    },
  },
  {
    role: "qa",
    label: "QA Engineer",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    description: "Testing and quality assurance management",
    permissions: {
      "Test Management": ["Create", "Read", "Update", "Execute"],
      "Test Execution": ["Run Tests", "Report Results", "Track Bugs"],
      Permissions: ["View Permissions"],
    },
  },
  {
    role: "developer",
    label: "Developer",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    description: "Task execution and content contribution",
    permissions: {
      "Task Management": ["Read", "Update Status"],
      "Content Management": ["Read", "Comment"],
      Permissions: ["View Permissions"],
    },
  },
]

export default function RolesPermissions() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-2">
          {rolePermissionsData.map((role) => (
            <TabsTrigger key={role.role} value={role.role} className="text-xs">
              {role.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {rolePermissionsData.map((role) => (
          <TabsContent key={role.role} value={role.role} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.label}
                    </CardTitle>
                    <CardDescription className="mt-2">{role.description}</CardDescription>
                  </div>
                  <Badge className={role.color}>{role.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(role.permissions).map(([module, perms]) => (
                    <div key={module} className="border-l-2 border-border pl-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {module}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{perm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
