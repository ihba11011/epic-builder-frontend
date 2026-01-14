export const paginationUtils = {
  // Calculate total pages
  getTotalPages: (totalItems: number, itemsPerPage: number): number => {
    return Math.ceil(totalItems / itemsPerPage)
  },

  // Get paginated items
  getPaginatedItems: <T,>(items: T[], currentPage: number, itemsPerPage: number): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  },

  // Get pagination info
  getPaginationInfo: (
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
  ): { startIndex: number; endIndex: number; isFirstPage: boolean; isLastPage: boolean } => {
    const startIndex = (currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems)
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      startIndex,
      endIndex,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
    }
  },

  // Validate page number
  validatePage: (page: number, totalPages: number): number => {
    if (page < 1) return 1
    if (page > totalPages) return totalPages
    return page
  },
}
