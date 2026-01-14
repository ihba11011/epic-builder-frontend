import type {
  User,
  UserRole,
  Project,
  Document,
  UserStory,
  TestSuite,
  TestCase,
  TestRun,
  Notification,
  AuditLog,
  ProjectMember,
  UserStatus,
} from "./types"
import {
  mockUsers,
  mockProjects,
  mockDocuments,
  mockStories,
  mockTestSuites,
  mockTestCases,
  mockTestRuns,
  mockNotifications,
  mockAuditLogs,
  mockProjectMembers,
  mockWorkspaces,
} from "./mock-data"
import { create } from "zustand"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Auth Service
export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay(800)
    const user = mockUsers.find((u) => u.email === email)
    if (!user) throw new Error("Invalid credentials")
    return user
  },

  async loginWithRole(role: UserRole): Promise<User> {
    await delay(500)
    const user = mockUsers.find((u) => u.role === role)
    if (!user) throw new Error("User not found")
    return user
  },

  async signup(email: string, password: string, name: string): Promise<User> {
    await delay(1000)
    return {
      id: `user-${Date.now()}`,
      email,
      name,
      role: "developer",
      workspaceIds: [],
      assignedProjectIds: [],
      createdAt: new Date().toISOString(),
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await delay(800)
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await delay(800)
  },

  async verifyEmail(token: string): Promise<void> {
    await delay(800)
  },

  async acceptInvite(token: string): Promise<User> {
    await delay(800)
    return mockUsers[5]
  },
}

// Project Service
export const projectService = {
  async list(workspaceId?: string): Promise<Project[]> {
    await delay(600)
    if (workspaceId) {
      return mockProjects.filter((p) => p.workspaceId === workspaceId)
    }
    return mockProjects
  },

  async get(id: string): Promise<Project | undefined> {
    await delay(400)
    return mockProjects.find((p) => p.id === id)
  },

  async create(data: Partial<Project>): Promise<Project> {
    await delay(800)
    return {
      id: `proj-${Date.now()}`,
      name: data.name || "New Project",
      description: data.description || "",
      workspaceId: data.workspaceId || "ws-1",
      status: "active",
      teamIds: data.teamIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    await delay(600)
    const project = mockProjects.find((p) => p.id === id)
    if (!project) throw new Error("Project not found")
    return { ...project, ...data, updatedAt: new Date().toISOString() }
  },

  async archive(id: string): Promise<void> {
    await delay(500)
  },

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    await delay(400)
    return mockProjectMembers.filter((m) => m.projectId === projectId)
  },

  async addMember(projectId: string, userId: string, role: UserRole): Promise<ProjectMember> {
    await delay(500)
    return {
      id: `pm-${Date.now()}`,
      userId,
      projectId,
      role,
      addedAt: new Date().toISOString(),
    }
  },

  async removeMember(memberId: string): Promise<void> {
    await delay(500)
  },
}

// Document Service
export const docService = {
  async list(projectId: string): Promise<Document[]> {
    await delay(500)
    return mockDocuments.filter((d) => d.projectId === projectId)
  },

  async get(id: string): Promise<Document | undefined> {
    await delay(400)
    return mockDocuments.find((d) => d.id === id)
  },

  async upload(projectId: string, data: Partial<Document>): Promise<Document> {
    await delay(1200)
    return {
      id: `doc-${Date.now()}`,
      projectId,
      name: data.name || "New Document",
      category: data.category || "Notes",
      content: data.content || "",
      status: "processing",
      ragStatus: "ingesting",
      versions: [],
      uploadedBy: data.uploadedBy || "user-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async update(id: string, data: Partial<Document>): Promise<Document> {
    await delay(600)
    const doc = mockDocuments.find((d) => d.id === id)
    if (!doc) throw new Error("Document not found")
    return { ...doc, ...data, updatedAt: new Date().toISOString() }
  },
}

// Story Service - using Zustand store
const useStoryStore = create<{ stories: UserStory[]; addStory: (story: UserStory) => void }>(() => ({
  stories: mockStories,
  addStory: (story) => {},
}))

export const storyService = {
  async list(projectId: string): Promise<UserStory[]> {
    await delay(500)
    const stories = useStoryStore.getState().stories
    return stories.filter((s) => s.projectId === projectId)
  },

  async get(id: string): Promise<UserStory | undefined> {
    await delay(400)
    const stories = useStoryStore.getState().stories
    return stories.find((s) => s.id === id)
  },

  async create(data: Partial<UserStory>): Promise<UserStory> {
    await delay(800)
    const newStory = {
      id: `story-${Date.now()}`,
      projectId: data.projectId || "",
      title: data.title || "New Story",
      description: data.description || "",
      acceptanceCriteria: data.acceptanceCriteria || [],
      status: "draft",
      priority: data.priority || "medium",
      linkedDocIds: [],
      linkedTestIds: [],
      versions: [],
      comments: [],
      activities: [],
      createdBy: data.createdBy || "user-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    useStoryStore.setState((state) => ({ stories: [...state.stories, newStory] }))
    return newStory
  },

  async update(id: string, data: Partial<UserStory>): Promise<UserStory> {
    await delay(600)
    const stories = useStoryStore.getState().stories
    const storyIndex = stories.findIndex((s) => s.id === id)
    if (storyIndex === -1) throw new Error("Story not found")
    const updatedStory = { ...stories[storyIndex], ...data, updatedAt: new Date().toISOString() }
    useStoryStore.setState((state) => ({
      stories: state.stories.map((s, index) => (index === storyIndex ? updatedStory : s)),
    }))
    return updatedStory
  },

  async approve(id: string): Promise<UserStory> {
    await delay(500)
    const stories = useStoryStore.getState().stories
    const storyIndex = stories.findIndex((s) => s.id === id)
    if (storyIndex === -1) throw new Error("Story not found")
    const approvedStory = { ...stories[storyIndex], status: "approved", updatedAt: new Date().toISOString() }
    useStoryStore.setState((state) => ({
      stories: state.stories.map((s, index) => (index === storyIndex ? approvedStory : s)),
    }))
    return approvedStory
  },

  async reject(id: string): Promise<UserStory> {
    await delay(500)
    const stories = useStoryStore.getState().stories
    const storyIndex = stories.findIndex((s) => s.id === id)
    if (storyIndex === -1) throw new Error("Story not found")
    const rejectedStory = { ...stories[storyIndex], status: "rejected", updatedAt: new Date().toISOString() }
    useStoryStore.setState((state) => ({
      stories: state.stories.map((s, index) => (index === storyIndex ? rejectedStory : s)),
    }))
    return rejectedStory
  },
}

// Test Service
export const testService = {
  async listSuites(projectId: string): Promise<TestSuite[]> {
    await delay(500)
    return mockTestSuites.filter((s) => s.projectId === projectId)
  },

  async createSuite(data: Partial<TestSuite>): Promise<TestSuite> {
    await delay(600)
    return {
      id: `suite-${Date.now()}`,
      projectId: data.projectId || "",
      name: data.name || "New Suite",
      description: data.description || "",
      testIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async listCases(projectId: string): Promise<TestCase[]> {
    await delay(500)
    return mockTestCases.filter((t) => t.projectId === projectId)
  },

  async getCase(id: string): Promise<TestCase | undefined> {
    await delay(400)
    return mockTestCases.find((t) => t.id === id)
  },

  async createCase(data: Partial<TestCase>): Promise<TestCase> {
    await delay(800)
    return {
      id: `test-${Date.now()}`,
      projectId: data.projectId || "",
      suiteId: data.suiteId || "",
      title: data.title || "New Test Case",
      description: data.description || "",
      preconditions: data.preconditions || "",
      steps: data.steps || [],
      expectedResult: data.expectedResult || "",
      priority: data.priority || "medium",
      status: "draft",
      versions: [],
      createdBy: data.createdBy || "user-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async updateCase(id: string, data: Partial<TestCase>): Promise<TestCase> {
    await delay(600)
    const test = mockTestCases.find((t) => t.id === id)
    if (!test) throw new Error("Test case not found")
    return { ...test, ...data, updatedAt: new Date().toISOString() }
  },

  async listRuns(projectId: string): Promise<TestRun[]> {
    await delay(500)
    return mockTestRuns.filter((r) => r.projectId === projectId)
  },

  async createRun(data: Partial<TestRun>): Promise<TestRun> {
    await delay(600)
    return {
      id: `run-${Date.now()}`,
      projectId: data.projectId || "",
      name: data.name || "New Test Run",
      testIds: data.testIds || [],
      results: (data.testIds || []).map((id) => ({ testId: id, status: "pending" as const })),
      status: "pending",
      createdBy: data.createdBy || "user-1",
      createdAt: new Date().toISOString(),
    }
  },

  async updateRun(id: string, data: Partial<TestRun>): Promise<TestRun> {
    await delay(500)
    const run = mockTestRuns.find((r) => r.id === id)
    if (!run) throw new Error("Test run not found")
    return { ...run, ...data }
  },
}

// Audit Service
export const auditService = {
  async list(filters?: { workspaceId?: string; projectId?: string; userId?: string; module?: string }): Promise<
    AuditLog[]
  > {
    await delay(500)
    let logs = [...mockAuditLogs]
    if (filters?.workspaceId) logs = logs.filter((l) => l.workspaceId === filters.workspaceId)
    if (filters?.projectId) logs = logs.filter((l) => l.projectId === filters.projectId)
    if (filters?.userId) logs = logs.filter((l) => l.userId === filters.userId)
    if (filters?.module) logs = logs.filter((l) => l.module === filters.module)
    return logs
  },

  async append(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    await delay(300)
    return {
      ...log,
      id: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
  },
}

// Notification Service
export const notificationService = {
  async list(userId: string): Promise<Notification[]> {
    await delay(400)
    return mockNotifications.filter((n) => n.userId === userId)
  },

  async create(data: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    await delay(300)
    return {
      ...data,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
  },

  async markRead(id: string): Promise<void> {
    await delay(200)
  },

  async markAllRead(userId: string): Promise<void> {
    await delay(300)
  },
}

// AI Service
export const aiService = {
  async generateStories(params: {
    projectId: string
    objective: string
    scope: string
    personas: string
    constraints: string
    docIds: string[]
  }): Promise<UserStory[]> {
    await delay(3000)
    return [
      {
        id: `story-gen-${Date.now()}-1`,
        projectId: params.projectId,
        epicId: "epic-gen-1",
        title: "User Authentication via OAuth",
        description: `As a user, I want to authenticate using OAuth providers so that I can quickly access the platform without creating a new account`,
        acceptanceCriteria: [
          "Support Google OAuth login",
          "Support GitHub OAuth login",
          "Handle OAuth errors gracefully",
          "Store user preferences after first login",
        ],
        status: "draft",
        priority: "high",
        linkedDocIds: params.docIds,
        linkedTestIds: [],
        versions: [],
        comments: [],
        activities: [],
        createdBy: "ai",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `story-gen-${Date.now()}-2`,
        projectId: params.projectId,
        epicId: "epic-gen-1",
        title: "User Profile Management",
        description: `As a user, I want to manage my profile information so that I can keep my account details up to date`,
        acceptanceCriteria: [
          "Edit display name",
          "Upload profile picture",
          "Change email with verification",
          "Update notification preferences",
        ],
        status: "draft",
        priority: "medium",
        linkedDocIds: params.docIds,
        linkedTestIds: [],
        versions: [],
        comments: [],
        activities: [],
        createdBy: "ai",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `story-gen-${Date.now()}-3`,
        projectId: params.projectId,
        epicId: "epic-gen-2",
        title: "Dashboard Analytics Overview",
        description: `As a user, I want to see an analytics overview on my dashboard so that I can track my activity and progress`,
        acceptanceCriteria: [
          "Show weekly activity chart",
          "Display key metrics cards",
          "Provide date range filter",
          "Export data as CSV",
        ],
        status: "draft",
        priority: "medium",
        linkedDocIds: params.docIds,
        linkedTestIds: [],
        versions: [],
        comments: [],
        activities: [],
        createdBy: "ai",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
  },

  async generateTests(params: { projectId: string; storyId?: string; docId?: string }): Promise<TestCase[]> {
    await delay(2500)
    return [
      {
        id: `test-gen-${Date.now()}-1`,
        projectId: params.projectId,
        suiteId: "suite-gen",
        title: "Positive Login Flow",
        description: "Verify user can login with valid credentials",
        preconditions: "User account exists and is active",
        steps: [
          { id: "s1", order: 1, action: "Navigate to login page", expectedResult: "Login form displayed" },
          { id: "s2", order: 2, action: "Enter valid email", expectedResult: "Email accepted" },
          { id: "s3", order: 3, action: "Enter valid password", expectedResult: "Password masked" },
          { id: "s4", order: 4, action: "Click login button", expectedResult: "User redirected to dashboard" },
        ],
        expectedResult: "User successfully logged in and viewing dashboard",
        priority: "high",
        status: "draft",
        linkedStoryId: params.storyId,
        versions: [],
        createdBy: "ai",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `test-gen-${Date.now()}-2`,
        projectId: params.projectId,
        suiteId: "suite-gen",
        title: "Invalid Password Login",
        description: "Verify error handling for invalid password",
        preconditions: "User account exists",
        steps: [
          { id: "s1", order: 1, action: "Navigate to login page", expectedResult: "Login form displayed" },
          { id: "s2", order: 2, action: "Enter valid email", expectedResult: "Email accepted" },
          { id: "s3", order: 3, action: "Enter invalid password", expectedResult: "Password accepted" },
          { id: "s4", order: 4, action: "Click login button", expectedResult: "Error message displayed" },
        ],
        expectedResult: "Error message shows invalid credentials",
        priority: "medium",
        status: "draft",
        linkedStoryId: params.storyId,
        versions: [],
        createdBy: "ai",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
  },

  async summarizeDoc(docId: string): Promise<string> {
    await delay(2000)
    return "This document outlines the product requirements for the e-commerce platform redesign. Key features include:\n\n• Enhanced user authentication with 2FA support\n• AI-powered product recommendations\n• Streamlined checkout process\n• Real-time inventory management\n• Mobile-first responsive design\n\nThe target launch is Q2 2025 with phased rollout to existing users."
  },

  async impactAnalysis(storyId: string): Promise<string> {
    await delay(2500)
    return "Impact Analysis Results:\n\n**Affected Components:**\n• Authentication Module\n• User Service\n• Session Management\n\n**Estimated Effort:** 8 story points\n\n**Risk Assessment:** Medium\n- Requires database migration\n- Impacts existing user sessions\n\n**Dependencies:**\n• API v2.0 deployment\n• Security audit completion"
  },
}

// User Management Service
export const userService = {
  async list(): Promise<User[]> {
    await delay(500)
    return mockUsers
  },

  async get(id: string): Promise<User | undefined> {
    await delay(300)
    return mockUsers.find((u) => u.id === id)
  },

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    await delay(800)
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...data,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    return newUser
  },

  async invite(email: string, role: UserRole): Promise<void> {
    await delay(800)
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    await delay(500)
    const user = mockUsers.find((u) => u.id === id)
    if (!user) throw new Error("User not found")
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() }
    const index = mockUsers.findIndex((u) => u.id === id)
    mockUsers[index] = updated
    return updated
  },

  async remove(id: string): Promise<void> {
    await delay(500)
    const index = mockUsers.findIndex((u) => u.id === id)
    if (index !== -1) {
      mockUsers[index].status = "deleted"
      mockUsers[index].updatedAt = new Date().toISOString()
    }
  },

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    await delay(400)
    const user = mockUsers.find((u) => u.id === id)
    if (!user) throw new Error("User not found")
    user.status = status
    user.updatedAt = new Date().toISOString()
    return user
  },
}

// Workspace Service
export const workspaceService = {
  async list(): Promise<typeof mockWorkspaces> {
    await delay(400)
    return mockWorkspaces
  },

  async get(id: string) {
    await delay(300)
    return mockWorkspaces.find((w) => w.id === id)
  },

  async create(data: { name: string; slug: string }) {
    await delay(600)
    return {
      id: `ws-${Date.now()}`,
      ...data,
      ownerId: "user-1",
      memberIds: ["user-1"],
      createdAt: new Date().toISOString(),
    }
  },
}
