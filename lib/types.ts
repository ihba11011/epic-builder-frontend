// Core types for the SDLC Platform

export type UserRole = "admin" | "pm" | "ba" | "qa" | "developer"
export type UserStatus = "active" | "inactive" | "deleted"

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  status: UserStatus
  workspaceIds: string[]
  assignedProjectIds: string[]
  lastLogin?: string
  lastActivity?: string
  createdAt: string
  updatedAt?: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  ownerId: string
  memberIds: string[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  workspaceId: string
  parentProjectId?: string
  status: "active" | "archived" | "completed"
  teamIds: string[]
  managerId?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: UserRole
  addedAt: string
}

export interface Document {
  id: string
  projectId: string
  name: string
  category: "PRD" | "SRS" | "BRD" | "Wireframes" | "APIs" | "Notes"
  content: string
  fileType?: string // MIME type: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, etc.
  fileName?: string // original filename with extension
  fileSize?: number // file size in bytes
  status: "draft" | "processing" | "ready"
  ragStatus: "pending" | "ingesting" | "completed" | "failed"
  versions: DocumentVersion[]
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  version: number
  content: string
  createdAt: string
  createdBy: string
}

export interface UserStory {
  id: string
  projectId: string
  epicId?: string
  title: string
  description: string
  acceptanceCriteria: string[]
  status: "draft" | "in-review" | "approved" | "published" | "rejected"
  priority: "low" | "medium" | "high" | "critical"
  assigneeId?: string
  linkedDocIds: string[]
  linkedTestIds: string[]
  sprint?: string
  storyPoints?: number
  versions: StoryVersion[]
  comments: Comment[]
  activities: Activity[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface StoryVersion {
  id: string
  version: number
  title: string
  description: string
  acceptanceCriteria: string[]
  createdAt: string
  createdBy: string
}

export interface TestSuite {
  id: string
  projectId: string
  name: string
  description: string
  testIds: string[]
  createdAt: string
  updatedAt: string
}

export interface TestCase {
  id: string
  projectId: string
  suiteId: string
  title: string
  description: string
  preconditions: string
  steps: TestStep[]
  expectedResult: string
  testData?: string
  priority: "low" | "medium" | "high" | "critical"
  status: "draft" | "active" | "deprecated"
  linkedStoryId?: string
  versions: TestVersion[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TestStep {
  id: string
  order: number
  action: string
  expectedResult: string
}

export interface TestVersion {
  id: string
  version: number
  title: string
  steps: TestStep[]
  createdAt: string
  createdBy: string
}

export interface TestRun {
  id: string
  projectId: string
  name: string
  testIds: string[]
  results: TestResult[]
  status: "pending" | "in-progress" | "completed"
  createdBy: string
  createdAt: string
  completedAt?: string
}

export interface TestResult {
  testId: string
  status: "pending" | "pass" | "fail" | "blocked" | "skipped"
  notes?: string
  executedAt?: string
  executedBy?: string
}

export interface Comment {
  id: string
  entityType: "story" | "test" | "document"
  entityId: string
  content: string
  mentions: string[]
  authorId: string
  createdAt: string
}

export interface Activity {
  id: string
  entityType: "project" | "story" | "test" | "document" | "user"
  entityId: string
  action: string
  details: string
  userId: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: "mention" | "approval" | "assignment" | "comment" | "system"
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export interface AuditLog {
  id: string
  workspaceId: string
  projectId?: string
  userId: string
  userName: string
  action: string
  module: string
  details: string
  ipAddress?: string
  createdAt: string
}

export interface AIGenerationLog {
  id: string
  projectId: string
  type: "stories" | "tests" | "summary" | "impact"
  prompt: string
  result: string
  status: "success" | "failed"
  userId: string
  createdAt: string
}

export interface Permission {
  module: string
  read: boolean
  write: boolean
  delete: boolean
  approve: boolean
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
}
