import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  User,
  Workspace,
  Project,
  Document,
  UserStory,
  TestSuite,
  TestCase,
  TestRun,
  Notification,
  AuditLog,
  AIGenerationLog,
  Activity,
  ProjectMember,
  UserRole,
  UserStatus,
} from "./types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" },
  ),
)

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setWorkspaces: (workspaces: Workspace[]) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  addWorkspace: (workspace: Workspace) => void
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  workspaces: [],
  currentWorkspace: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
}))

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  projectMembers: ProjectMember[]
  selectedProject: Project | null
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  setProjectMembers: (members: ProjectMember[]) => void
  addProjectMember: (member: ProjectMember) => void
  removeProjectMember: (memberId: string) => void
  setSelectedProject: (project: Project | null) => void
  getProjectsByWorkspace: (workspaceId: string) => Project[]
  getSubprojects: (parentProjectId: string) => Project[]
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  projectMembers: [],
  selectedProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  setProjectMembers: (members) => set({ projectMembers: members }),
  addProjectMember: (member) => set((state) => ({ projectMembers: [...state.projectMembers, member] })),
  removeProjectMember: (memberId) =>
    set((state) => ({
      projectMembers: state.projectMembers.filter((m) => m.id !== memberId),
    })),
  setSelectedProject: (project) => set({ selectedProject: project }),
  getProjectsByWorkspace: (workspaceId: string) => {
    const state = get()
    return state.projects.filter((p) => p.workspaceId === workspaceId && !p.parentProjectId)
  },
  getSubprojects: (parentProjectId: string) => {
    const state = get()
    return state.projects.filter((p) => p.parentProjectId === parentProjectId)
  },
}))

interface DocumentState {
  documents: Document[]
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
}

export const useDocumentStore = create<DocumentState>()((set) => ({
  documents: [],
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
}))

interface StoryState {
  stories: UserStory[]
  setStories: (stories: UserStory[]) => void
  addStory: (story: UserStory) => void
  addStories: (stories: UserStory[]) => void
  updateStory: (id: string, updates: Partial<UserStory>) => void
}

export const useStoryStore = create<StoryState>()((set) => ({
  stories: [],
  setStories: (stories) => set({ stories }),
  addStory: (story) => set((state) => ({ stories: [...state.stories, story] })),
  addStories: (stories) => set((state) => ({ stories: [...state.stories, ...stories] })),
  updateStory: (id, updates) =>
    set((state) => ({
      stories: state.stories.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
}))

interface TestState {
  testSuites: TestSuite[]
  testCases: TestCase[]
  testRuns: TestRun[]
  setTestSuites: (suites: TestSuite[]) => void
  addTestSuite: (suite: TestSuite) => void
  setTestCases: (cases: TestCase[]) => void
  addTestCase: (testCase: TestCase) => void
  addTestCases: (cases: TestCase[]) => void
  updateTestCase: (id: string, updates: Partial<TestCase>) => void
  setTestRuns: (runs: TestRun[]) => void
  addTestRun: (run: TestRun) => void
  updateTestRun: (id: string, updates: Partial<TestRun>) => void
}

export const useTestStore = create<TestState>()((set) => ({
  testSuites: [],
  testCases: [],
  testRuns: [],
  setTestSuites: (suites) => set({ testSuites: suites }),
  addTestSuite: (suite) => set((state) => ({ testSuites: [...state.testSuites, suite] })),
  setTestCases: (cases) => set({ testCases: cases }),
  addTestCase: (testCase) => set((state) => ({ testCases: [...state.testCases, testCase] })),
  addTestCases: (cases) => set((state) => ({ testCases: [...state.testCases, ...cases] })),
  updateTestCase: (id, updates) =>
    set((state) => ({
      testCases: state.testCases.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  setTestRuns: (runs) => set({ testRuns: runs }),
  addTestRun: (run) => set((state) => ({ testRuns: [...state.testRuns, run] })),
  updateTestRun: (id, updates) =>
    set((state) => ({
      testRuns: state.testRuns.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
}))

interface NotificationState {
  notifications: Notification[]
  filteredNotifications: Notification[]
  currentPage: number
  itemsPerPage: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  filterNotifications: (filters: { type?: string; read?: boolean | null }) => void
  resetFilters: () => void
  getPaginatedNotifications: () => Notification[]
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  filteredNotifications: [],
  currentPage: 1,
  itemsPerPage: 10,
  setNotifications: (notifications) => set({ notifications, filteredNotifications: notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      filteredNotifications: [notification, ...state.filteredNotifications],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      filteredNotifications: state.filteredNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      filteredNotifications: state.filteredNotifications.map((n) => ({ ...n, read: true })),
    })),
  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      filteredNotifications: state.filteredNotifications.filter((n) => n.id !== id),
    })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (items) => set({ itemsPerPage: items, currentPage: 1 }),
  filterNotifications: (filters) => {
    const state = get()
    let filtered = [...state.notifications]

    if (filters.type) {
      filtered = filtered.filter((n) => n.type === filters.type)
    }

    if (filters.read !== null && filters.read !== undefined) {
      filtered = filtered.filter((n) => n.read === filters.read)
    }

    set({ filteredNotifications: filtered, currentPage: 1 })
  },
  resetFilters: () => {
    const state = get()
    set({ filteredNotifications: state.notifications, currentPage: 1 })
  },
  getPaginatedNotifications: () => {
    const state = get()
    const start = (state.currentPage - 1) * state.itemsPerPage
    const end = start + state.itemsPerPage
    return state.filteredNotifications.slice(start, end)
  },
}))

interface AuditState {
  auditLogs: AuditLog[]
  aiLogs: AIGenerationLog[]
  activities: Activity[]
  setAuditLogs: (logs: AuditLog[]) => void
  addAuditLog: (log: AuditLog) => void
  setAILogs: (logs: AIGenerationLog[]) => void
  addAILog: (log: AIGenerationLog) => void
  setActivities: (activities: Activity[]) => void
  addActivity: (activity: Activity) => void
}

export const useAuditStore = create<AuditState>()((set) => ({
  auditLogs: [],
  aiLogs: [],
  activities: [],
  setAuditLogs: (logs) => set({ auditLogs: logs }),
  addAuditLog: (log) => set((state) => ({ auditLogs: [log, ...state.auditLogs] })),
  setAILogs: (logs) => set({ aiLogs: logs }),
  addAILog: (log) => set((state) => ({ aiLogs: [log, ...state.aiLogs] })),
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),
}))

interface UserManagementState {
  users: User[]
  filteredUsers: User[]
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  removeUser: (id: string) => void
  setFilteredUsers: (users: User[]) => void
  updateUserStatus: (id: string, status: UserStatus) => void
  filterUsers: (query: {
    search?: string
    role?: UserRole | "all"
    status?: UserStatus | "all"
    dateFrom?: string
    dateTo?: string
  }) => void
}

export const useUserManagementStore = create<UserManagementState>()((set, get) => ({
  users: [],
  filteredUsers: [],
  setUsers: (users) => set({ users, filteredUsers: users }),
  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user],
      filteredUsers: [...state.filteredUsers, user],
    })),
  updateUser: (id, updates) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      filteredUsers: state.filteredUsers.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),
  updateUserStatus: (id, status) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, status } : u)),
      filteredUsers: state.filteredUsers.map((u) => (u.id === id ? { ...u, status } : u)),
    })),
  removeUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      filteredUsers: state.filteredUsers.filter((u) => u.id !== id),
    })),
  setFilteredUsers: (users) => set({ filteredUsers: users }),
  filterUsers: (query) => {
    const state = get()
    let filtered = [...state.users]

    if (query.search) {
      const search = query.search.toLowerCase()
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search))
    }

    if (query.role && query.role !== "all") {
      filtered = filtered.filter((u) => u.role === query.role)
    }

    if (query.status && query.status !== "all") {
      filtered = filtered.filter((u) => u.status === query.status)
    }

    if (query.dateFrom) {
      filtered = filtered.filter((u) => new Date(u.createdAt) >= new Date(query.dateFrom!))
    }

    if (query.dateTo) {
      filtered = filtered.filter((u) => new Date(u.createdAt) <= new Date(query.dateTo!))
    }

    set({ filteredUsers: filtered })
  },
}))

interface UIState {
  sidebarCollapsed: boolean
  theme: "light" | "dark"
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: "light" | "dark") => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "dark",
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    }),
    { name: "ui-storage" },
  ),
)
