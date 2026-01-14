import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all edges for this user
    const { data: edges, error: edgesError } = await supabase
      .from("edges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (edgesError) {
      return NextResponse.json(
        { error: `Failed to fetch edges: ${edgesError.message}` },
        { status: 500 }
      );
    }

    // Fetch all logs for this user
    const { data: logs, error: logsError } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (logsError) {
      return NextResponse.json(
        { error: `Failed to fetch logs: ${logsError.message}` },
        { status: 500 }
      );
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      stats: {
        totalEdges: edges?.length || 0,
        totalLogs: logs?.length || 0,
      },
      edges: edges || [],
      logs: logs || [],
    };

    const filename = `edgetracker-backup-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}
