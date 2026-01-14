import type { User } from "@/lib/types"

export const exportUtils = {
  // Export users as CSV
  exportUsersAsCSV: (users: User[]): void => {
    const headers = ["Name", "Email", "Role", "Status", "Created Date", "Last Login"]
    const rows = users.map((user) => [
      user.name,
      user.email,
      user.role,
      user.status,
      new Date(user.createdAt).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `users-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Export users as JSON
  exportUsersAsJSON: (users: User[]): void => {
    const jsonContent = JSON.stringify(users, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `users-${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Generate user report
  generateUserReport: (users: User[]): string => {
    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.status === "active").length
    const inactiveUsers = users.filter((u) => u.status === "inactive").length
    const admins = users.filter((u) => u.role === "admin").length
    const neverLoggedIn = users.filter((u) => !u.lastLogin).length

    return `
User Management Report
Generated: ${new Date().toLocaleString()}

Summary Statistics:
- Total Users: ${totalUsers}
- Active Users: ${activeUsers}
- Inactive Users: ${inactiveUsers}
- Admin Users: ${admins}
- Never Logged In: ${neverLoggedIn}

Role Distribution:
${users
  .reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  .map(([role, count]) => `- ${role}: ${count}`)
  .join("\n")}
    `
  },
}
