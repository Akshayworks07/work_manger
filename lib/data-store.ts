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
  UserRole,
} from "./types";
import {
  MOCK_CLIENTS,
  MOCK_PROJECTS,
  MOCK_VIDEOS,
  DEFAULT_COLUMNS,
  MOCK_PROFILE,
  MOCK_TEAM_MATE,
} from "./mock-data";

// In-memory / localStorage cache for demo mode
let localClients = [...MOCK_CLIENTS];
let localProjects = [...MOCK_PROJECTS];
let localVideos = [...MOCK_VIDEOS];
let localColumns = [...DEFAULT_COLUMNS];
let localRegisteredProfiles = [MOCK_PROFILE, MOCK_TEAM_MATE];

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
    const fallbackUsername =
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "user";

    return {
      id: user.id,
      full_name:
        user.user_metadata?.full_name || fallbackUsername,
      username: fallbackUsername,
      email: user.email || "",
      role: (user.user_metadata?.role as UserRole) || "team-mate",
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at,
    };
  }

  return data as Profile;
}

export function setDemoProfile(profile: Profile): void {
  setStoredState("profile", profile);
}

// Securely resolves a username to its associated account email for Supabase Auth
export async function getUserEmailByUsername(username: string): Promise<string | null> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return null;

  // If user already typed an email address, return it
  if (cleanUsername.includes("@")) {
    return cleanUsername;
  }

  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const storedProfiles = getStoredState("registered_profiles", localRegisteredProfiles);
    const matched = storedProfiles.find(
      (p) => p.username.toLowerCase() === cleanUsername
    );
    return matched ? matched.email : null;
  }

  try {
    const supabase = createClient();
    // 1. Check profiles table with case-insensitive match
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .ilike("username", cleanUsername)
      .limit(1)
      .maybeSingle();

    if (!error && data?.email) {
      return data.email;
    }

    // 2. Fallback to security-definer helper RPC function
    const { data: rpcEmail, error: rpcError } = await supabase.rpc(
      "get_email_by_username",
      { p_username: cleanUsername }
    );
    if (!rpcError && rpcEmail) {
      return rpcEmail;
    }

    return null;
  } catch (err) {
    console.warn("Username lookup failed:", err);
    return null;
  }
}

export function registerDemoUser(profile: Profile): void {
  const stored = getStoredState("registered_profiles", localRegisteredProfiles);
  const updated = [profile, ...stored.filter((p) => p.username !== profile.username)];
  setStoredState("registered_profiles", updated);
  setStoredState("profile", profile);
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

export async function fetchProjects(clientId?: string, forUserId?: string): Promise<Project[]> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    let all = getStoredState("projects", localProjects);
    if (clientId) {
      all = all.filter((p) => p.client_id === clientId);
    }
    if (forUserId) {
      const allVideos = getStoredState("videos", localVideos);
      const userProjectIds = new Set(
        allVideos.filter((v) => v.assigned_to === forUserId).map((v) => v.project_id)
      );
      all = all.filter((p) => userProjectIds.has(p.id));
    }
    return all;
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
    let all = getStoredState("projects", localProjects);
    if (clientId) {
      all = all.filter((p) => p.client_id === clientId);
    }
    return all;
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

export async function deleteProjectRecord(projectId: string): Promise<void> {
  const isLive = isSupabaseConfigured();
  if (!isLive) {
    const projects = getStoredState("projects", localProjects);
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    setStoredState("projects", updatedProjects);
    localProjects = updatedProjects;

    // Cascade delete associated deliverables
    const videos = getStoredState("videos", localVideos);
    const updatedVideos = videos.filter((v) => v.project_id !== projectId);
    setStoredState("videos", updatedVideos);
    localVideos = updatedVideos;
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
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
    const rawVideos = getStoredState("videos", localVideos);
    const rawProjects = getStoredState("projects", localProjects);
    const rawClients = getStoredState("clients", localClients);
    const storedProfiles = getStoredState("registered_profiles", localRegisteredProfiles);

    return rawVideos.map((v) => {
      const proj = rawProjects.find((p) => p.id === v.project_id);
      const client = proj ? rawClients.find((c) => c.id === proj.client_id) : undefined;
      const assignee = storedProfiles.find((p) => p.id === v.assigned_to) || null;

      return {
        ...v,
        project: proj ? { ...proj, client } : undefined,
        assignee,
      };
    });
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*, project:projects(*, client:clients(*)), assignee:profiles(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Falling back to local videos:", err);
    const rawVideos = getStoredState("videos", localVideos);
    const rawProjects = getStoredState("projects", localProjects);
    const rawClients = getStoredState("clients", localClients);
    return rawVideos.map((v) => {
      const proj = rawProjects.find((p) => p.id === v.project_id);
      const client = proj ? rawClients.find((c) => c.id === proj.client_id) : undefined;
      return {
        ...v,
        project: proj ? { ...proj, client } : undefined,
      };
    });
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

export async function getDashboardStats(userProfile?: Profile | null): Promise<DashboardStats> {
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
