"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"

interface AdvancedFiltersProps {
  onApply: (filters: any) => void
  onReset: () => void
}

export default function AdvancedFilters({ onApply, onReset }: AdvancedFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Advanced Filters
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Login Status</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="never">Never Logged In</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Workspace Count</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="0">No Workspaces</SelectItem>
                <SelectItem value="1">1+ Workspaces</SelectItem>
                <SelectItem value="3">3+ Workspaces</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Quick Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="admins-only" />
              <label htmlFor="admins-only" className="text-sm cursor-pointer">
                Admins Only
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="inactive-users" />
              <label htmlFor="inactive-users" className="text-sm cursor-pointer">
                Inactive Users
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="no-projects" />
              <label htmlFor="no-projects" className="text-sm cursor-pointer">
                No Projects Assigned
              </label>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={() => onApply({})}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}
