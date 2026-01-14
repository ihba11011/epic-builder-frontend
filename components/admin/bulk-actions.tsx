"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Trash2 } from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  onSelectAll: (selected: boolean) => void
  onExport: () => void
  onStatusChange?: (status: "active" | "inactive") => void
  onDeleteSelected?: () => void
  isSelectAll: boolean
}

export default function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onExport,
  onStatusChange,
  onDeleteSelected,
  isSelectAll,
}: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox checked={isSelectAll} onCheckedChange={onSelectAll} />
            <span className="text-sm font-medium">
              {selectedCount} of {totalCount} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {onStatusChange && (
              <Select onValueChange={(value) => onStatusChange(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Mark Active</SelectItem>
                  <SelectItem value="inactive">Mark Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}

            {onDeleteSelected && (
              <Button size="sm" variant="destructive" onClick={onDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
