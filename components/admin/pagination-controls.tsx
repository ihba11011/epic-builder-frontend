"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (items: number) => void
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationControlsProps) {
  const [jumpToPageInput, setJumpToPageInput] = useState("")

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const handleJumpToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpToPageInput("")
    }
  }

  const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setJumpToPageInput(value)
  }

  const handleJumpInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNum = Number.parseInt(jumpToPageInput, 10)
      if (!isNaN(pageNum)) {
        handleJumpToPage(pageNum)
      }
    } else if (e.key === "Escape") {
      setJumpToPageInput("")
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number.parseInt(value)
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Info and Items per page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Showing <span className="font-semibold text-foreground">{startIndex}</span> to{" "}
          <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
          <span className="font-semibold text-foreground">{totalItems}</span> items
        </p>

        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
              Per page:
            </label>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger id="items-per-page" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Center: Page info and Jump to page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </p>

        {totalPages > 5 && (
          <div className="flex items-center gap-2">
            <label htmlFor="jump-to-page" className="text-xs text-muted-foreground whitespace-nowrap">
              Jump to:
            </label>
            <Input
              id="jump-to-page"
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPageInput}
              onChange={handleJumpInputChange}
              onKeyDown={handleJumpInputKeyDown}
              placeholder="Page #"
              className="w-16 h-9"
              aria-label="Jump to page number"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const pageNum = Number.parseInt(jumpToPageInput, 10)
                if (!isNaN(pageNum)) {
                  handleJumpToPage(pageNum)
                }
              }}
              disabled={
                !jumpToPageInput ||
                Number.parseInt(jumpToPageInput, 10) < 1 ||
                Number.parseInt(jumpToPageInput, 10) > totalPages
              }
              className="whitespace-nowrap"
            >
              Go
            </Button>
          </div>
        )}
      </div>

      {/* Right: Pagination navigation buttons */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {/* First page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleJumpToPage(1)}
          disabled={currentPage === 1}
          title="First page"
          aria-label="Go to first page"
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleJumpToPage(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
          aria-label="Go to previous page"
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers with smart display */}
        <div className="flex items-center gap-1 min-w-fit">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true
              if (page === 1 || page === totalPages) return true
              if (page >= currentPage - 1 && page <= currentPage + 1) return true
              return false
            })
            .map((page, index, arr) => (
              <div key={page} className="flex items-center gap-1">
                {index > 0 && arr[index - 1] + 1 < page && (
                  <span className="px-1 text-muted-foreground text-sm">...</span>
                )}
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleJumpToPage(page)}
                  className="w-9 h-9 flex-shrink-0"
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </Button>
              </div>
            ))}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleJumpToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
          aria-label="Go to next page"
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleJumpToPage(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
          aria-label="Go to last page"
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
