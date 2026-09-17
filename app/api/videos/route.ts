import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MOCK_VIDEOS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref") &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );

    if (!isConfigured) {
      const data = projectId
        ? MOCK_VIDEOS.filter((v) => v.project_id === projectId)
        : MOCK_VIDEOS;
      return NextResponse.json({ videos: data });
    }

    const supabase = createClient();
    let query = supabase.from("videos").select("*, assignee:profiles(*)");

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query.order("position", { ascending: true });

    if (error) {
      const fallback = projectId
        ? MOCK_VIDEOS.filter((v) => v.project_id === projectId)
        : MOCK_VIDEOS;
      return NextResponse.json({ videos: fallback });
    }

    return NextResponse.json({ videos: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, title, status = "not_started", due_date, thumbnail_url } = body;

    if (!project_id || !title) {
      return NextResponse.json(
        { error: "project_id and title are required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("videos")
      .insert([
        {
          project_id,
          title,
          status,
          due_date: due_date || null,
          thumbnail_url: thumbnail_url || null,
          position: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ video: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, position } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (status !== undefined) {
      updatePayload.status = status;
      if (status === "delivered") {
        updatePayload.delivered_at = new Date().toISOString();
      }
    }
    if (position !== undefined) {
      updatePayload.position = position;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("videos")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ video: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
