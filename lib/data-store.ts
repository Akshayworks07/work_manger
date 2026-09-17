"use client";

import { createClient, isSupabaseConfigured } from "./supabase/client";
import {
  Client,
  Project,
  Video,
  KanbanColumn,
  Profile,
  DashboardStats,
  VideoStatus,
} from "./types";
import {
  MOCK_CLIENTS,
  MOCK_PROJECTS,
  MOCK_VIDEOS,
  DEFAULT_COLUMNS,
  MOCK_PROFILE,
} from "./mock-data";

// In-memory / localStorage cache for demo mode
let localClients = [...MOCK_CLIENTS];
let localProjects = [...MOCK_PROJECTS];
let localVideos = [...MOCK_VIDEOS];
let localColumns = [...DEFAULT_COLUMNS];

function getStoredState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(`vdt_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredState<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`vdt_${key}`, JSON.stringify(val));
  } catch {}
}

export async function getCurrentProfile(): Promise<Profile> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    return getStoredState("profile", MOCK_PROFILE);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return MOCK_PROFILE;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      role: (user.user_metadata?.role as "admin" | "client") || "admin",
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at,
    };
  }

  return data as Profile;
}

export async function fetchClients(): Promise<Client[]> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    return getStoredState("clients", localClients);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Falling back to local clients:", err);
    return getStoredState("clients", localClients);
  }
}

export async function createClientRecord(client: Omit<Client, "id" | "created_at">): Promise<Client> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const newClient: Client = {
      ...client,
      id: "c-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    const clients = getStoredState("clients", localClients);
    const updated = [newClient, ...clients];
    setStoredState("clients", updated);
    localClients = updated;
    return newClient;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert([client])
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function fetchProjects(clientId?: string): Promise<Project[]> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const all = getStoredState("projects", localProjects);
    return clientId ? all.filter((p) => p.client_id === clientId) : all;
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("projects")
      .select("*, client:clients(*)")
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Falling back to local projects:", err);
    const all = getStoredState("projects", localProjects);
    return clientId ? all.filter((p) => p.client_id === clientId) : all;
  }
}

export async function createProjectRecord(project: {
  client_id: string;
  name: string;
  description?: string | null;
  status?: "active" | "completed" | "on_hold";
}): Promise<Project> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const newProject: Project = {
      id: "p-" + Date.now(),
      client_id: project.client_id,
      name: project.name,
      description: project.description || null,
      status: project.status || "active",
      created_at: new Date().toISOString(),
    };
    const projects = getStoredState("projects", localProjects);
    const updated = [newProject, ...projects];
    setStoredState("projects", updated);
    localProjects = updated;
    return newProject;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        client_id: project.client_id,
        name: project.name,
        description: project.description || null,
        status: project.status || "active",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function fetchProjectDetails(projectId: string): Promise<{
  project: Project | null;
  columns: KanbanColumn[];
  videos: Video[];
}> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const projects = getStoredState("projects", localProjects);
    const project = projects.find((p) => p.id === projectId) || null;
    const allVideos = getStoredState("videos", localVideos);
    const videos = allVideos.filter((v) => v.project_id === projectId);
    return {
      project,
      columns: DEFAULT_COLUMNS.map((c) => ({ ...c, project_id: projectId })),
      videos,
    };
  }

  try {
    const supabase = createClient();
    const [projectRes, columnsRes, videosRes] = await Promise.all([
      supabase.from("projects").select("*, client:clients(*)").eq("id", projectId).single(),
      supabase.from("kanban_columns").select("*").eq("project_id", projectId).order("position", { ascending: true }),
      supabase.from("videos").select("*, assignee:profiles(*)").eq("project_id", projectId).order("position", { ascending: true }),
    ]);

    let columns = columnsRes.data || [];
    if (columns.length === 0) {
      columns = DEFAULT_COLUMNS.map((c) => ({ ...c, project_id: projectId }));
    }

    return {
      project: projectRes.data || null,
      columns,
      videos: videosRes.data || [],
    };
  } catch (err) {
    console.warn("Falling back to local project details:", err);
    const projects = getStoredState("projects", localProjects);
    const project = projects.find((p) => p.id === projectId) || null;
    const allVideos = getStoredState("videos", localVideos);
    const videos = allVideos.filter((v) => v.project_id === projectId);
    return {
      project,
      columns: DEFAULT_COLUMNS.map((c) => ({ ...c, project_id: projectId })),
      videos,
    };
  }
}

export async function fetchAllVideos(): Promise<Video[]> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    return getStoredState("videos", localVideos);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*, project:projects(*, client:clients(*))")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Falling back to local videos:", err);
    return getStoredState("videos", localVideos);
  }
}

export async function updateVideoStatus(
  videoId: string,
  newStatus: VideoStatus,
  newPosition: number = 0
): Promise<void> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const videos = getStoredState("videos", localVideos);
    const updated = videos.map((v) =>
      v.id === videoId
        ? {
            ...v,
            status: newStatus,
            position: newPosition,
            delivered_at: newStatus === "delivered" ? new Date().toISOString() : v.delivered_at,
          }
        : v
    );
    setStoredState("videos", updated);
    localVideos = updated;
    return;
  }

  const supabase = createClient();
  const updatePayload: Record<string, any> = {
    status: newStatus,
    position: newPosition,
  };
  if (newStatus === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("videos")
    .update(updatePayload)
    .eq("id", videoId);

  if (error) throw error;
}

export async function createVideoRecord(video: {
  project_id: string;
  title: string;
  status: VideoStatus;
  due_date?: string | null;
  thumbnail_url?: string | null;
  assigned_to?: string | null;
}): Promise<Video> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const newVideo: Video = {
      id: "v-" + Date.now(),
      project_id: video.project_id,
      title: video.title,
      status: video.status || "not_started",
      due_date: video.due_date || null,
      thumbnail_url: video.thumbnail_url || null,
      assigned_to: video.assigned_to || null,
      delivered_at: video.status === "delivered" ? new Date().toISOString() : null,
      position: 0,
      created_at: new Date().toISOString(),
    };
    const videos = getStoredState("videos", localVideos);
    const updated = [newVideo, ...videos];
    setStoredState("videos", updated);
    localVideos = updated;
    return newVideo;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("videos")
    .insert([
      {
        project_id: video.project_id,
        title: video.title,
        status: video.status,
        due_date: video.due_date || null,
        thumbnail_url: video.thumbnail_url || null,
        assigned_to: video.assigned_to || null,
        position: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Video;
}

export async function deleteVideoRecord(videoId: string): Promise<void> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const videos = getStoredState("videos", localVideos);
    const updated = videos.filter((v) => v.id !== videoId);
    setStoredState("videos", updated);
    localVideos = updated;
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw error;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [clients, projects, videos] = await Promise.all([
    fetchClients(),
    fetchProjects(),
    fetchAllVideos(),
  ]);

  const totalVideos = videos.length;
  const deliveredVideos = videos.filter((v) => v.status === "delivered").length;
  const inProgressVideos = videos.filter((v) => v.status === "in_progress").length;
  const needingWorkVideos = videos.filter(
    (v) => v.status === "not_started" || v.status === "revision"
  ).length;

  const statusBreakdown = [
    { name: "Not Started", value: videos.filter((v) => v.status === "not_started").length, color: "#94a3b8", key: "not_started" as VideoStatus },
    { name: "In Progress", value: inProgressVideos, color: "#f59e0b", key: "in_progress" as VideoStatus },
    { name: "Review", value: videos.filter((v) => v.status === "review").length, color: "#a855f7", key: "review" as VideoStatus },
    { name: "Revision", value: videos.filter((v) => v.status === "revision").length, color: "#f43f5e", key: "revision" as VideoStatus },
    { name: "Delivered", value: deliveredVideos, color: "#10b981", key: "delivered" as VideoStatus },
  ];

  // Client summaries
  const clientSummaries = clients.map((client) => {
    const clientProjects = projects.filter((p) => p.client_id === client.id);
    const projectIds = new Set(clientProjects.map((p) => p.id));
    const clientVideos = videos.filter((v) => projectIds.has(v.project_id));
    const clientDelivered = clientVideos.filter((v) => v.status === "delivered").length;
    const progressPercentage = clientVideos.length > 0 ? Math.round((clientDelivered / clientVideos.length) * 100) : 0;

    return {
      client,
      totalVideos: clientVideos.length,
      deliveredVideos: clientDelivered,
      progressPercentage,
    };
  });

  // Videos due within next 7 days
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const dueThisWeek = videos.filter((v) => {
    if (!v.due_date || v.status === "delivered") return false;
    const due = new Date(v.due_date);
    return due >= now && due <= nextWeek;
  });

  return {
    totalVideos,
    deliveredVideos,
    inProgressVideos,
    needingWorkVideos,
    statusBreakdown,
    clientSummaries,
    dueThisWeek,
  };
}
