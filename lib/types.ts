export type UserRole = "admin" | "client";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  logo_url: string | null;
  contact_email: string | null;
  owner_id: string | null;
  created_at: string;
}

export type ProjectStatus = "active" | "completed" | "on_hold";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  client?: Client;
  video_count?: number;
  delivered_count?: number;
}

export type VideoStatus =
  | "not_started"
  | "in_progress"
  | "review"
  | "revision"
  | "delivered";

export interface Video {
  id: string;
  project_id: string;
  title: string;
  status: VideoStatus;
  assigned_to: string | null;
  thumbnail_url: string | null;
  due_date: string | null;
  delivered_at: string | null;
  position: number;
  created_at: string;
  assignee?: Profile | null;
  project?: Project;
}

export interface KanbanColumn {
  id: string;
  project_id: string;
  name: string;
  position: number;
}

export interface DashboardStats {
  totalVideos: number;
  deliveredVideos: number;
  inProgressVideos: number;
  needingWorkVideos: number;
  statusBreakdown: {
    name: string;
    value: number;
    color: string;
    key: VideoStatus;
  }[];
  clientSummaries: {
    client: Client;
    totalVideos: number;
    deliveredVideos: number;
    progressPercentage: number;
  }[];
  dueThisWeek: Video[];
}
