"use client"

import { useState, useMemo } from "react"
import type { AuditLog } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, User, Activity, Download, RotateCcw } from "lucide-react"

interface AuditLogsViewerProps {
  logs: AuditLog[]
}

const ITEMS_PER_PAGE = 10
const EMPTY_STATE_ITEMS_PER_PAGE = 10

const moduleColors: Record<string, string> = {
  "user-management": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "project-management": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "content-management": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "system-settings": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "audit-logs": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300",
  APPROVE: "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  REJECT: "bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  INVITE: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  LOGIN: "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
}

function AuditLogsViewer({ logs }: AuditLogsViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)

  const modules = useMemo(() => ["all", ...new Set(logs.map((l) => l.module))], [logs])
  const actions = useMemo(() => ["all", ...new Set(logs.map((l) => l.action))], [logs])
  const users = useMemo(() => ["all", ...new Set(logs.map((l) => l.userName))], [logs])

  const filteredLogs = useMemo(() => {
    let result = logs

    if (searchQuery) {
      result = result.filter(
        (log) =>
          log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.details.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (moduleFilter !== "all") {
      result = result.filter((log) => log.module === moduleFilter)
    }

    if (actionFilter !== "all") {
      result = result.filter((log) => log.action === actionFilter)
    }

    if (userFilter !== "all") {
      result = result.filter((log) => log.userName === userFilter)
    }

    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB
    })
  }, [logs, searchQuery, moduleFilter, actionFilter, userFilter, sortOrder])

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  const handleFilterChange = (callback: () => void) => {
    setCurrentPage(1)
    callback()
  }

  const handleExport = (format: "csv" | "json") => {
    const dataToExport = paginatedLogs.length > 0 ? paginatedLogs : filteredLogs

    if (format === "csv") {
      const headers = ["ID", "User", "Action", "Module", "Details", "IP Address", "Timestamp"]
      const rows = dataToExport.map((log) => [
        log.id,
        log.userName,
        log.action,
        log.module,
        log.details,
        log.ipAddress || "N/A",
        new Date(log.createdAt).toLocaleString(),
      ])

      const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } else {
      const json = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`
      a.click()
    }
  }

  const handleReset = () => {
    setSearchQuery("")
    setModuleFilter("all")
    setActionFilter("all")
    setUserFilter("all")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                disabled={filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                disabled={filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          <div className="grid gap-4 mt-4 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user or details..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
                className="pl-10"
              />
            </div>
            <Select value={moduleFilter} onValueChange={(value) => handleFilterChange(() => setModuleFilter(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module === "all" ? "All Modules" : module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={(value) => handleFilterChange(() => setActionFilter(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action === "all" ? "All Actions" : action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={(value) => handleFilterChange(() => setUserFilter(value))}>
              <SelectTrigger>
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user === "all" ? "All Users" : user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={searchQuery === "" && moduleFilter === "all" && actionFilter === "all" && userFilter === "all"}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No audit logs found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userId}</p>
                        </div>
                        <Badge className={moduleColors[log.module] || "bg-gray-100"}>{log.module}</Badge>
                        <Badge className={actionColors[log.action] || "bg-gray-100"}>{log.action}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{log.details}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </time>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </time>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLog(log)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this audit event</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm font-semibold">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono text-muted-foreground">{selectedLog.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Module</p>
                  <Badge className={moduleColors[selectedLog.module]}>{selectedLog.module}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <Badge className={actionColors[selectedLog.action]}>{selectedLog.action}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                  <p className="text-sm font-mono text-muted-foreground">{selectedLog.workspaceId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-mono whitespace-pre-wrap break-words">{selectedLog.details}</p>
                </div>
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.projectId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project ID</p>
                  <p className="text-sm font-mono text-muted-foreground">{selectedLog.projectId}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditLogsViewer
