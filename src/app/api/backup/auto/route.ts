import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

// User email to backup - configured via environment variable
const BACKUP_USER_EMAIL = process.env.BACKUP_USER_EMAIL;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (!BACKUP_USER_EMAIL) {
      console.error("BACKUP_USER_EMAIL not configured");
      return NextResponse.json({ error: "Backup user not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Failed to list users:", userError);
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const user = users.users.find(u => u.email === BACKUP_USER_EMAIL);

    if (!user) {
      console.error(`User not found: ${BACKUP_USER_EMAIL}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all data for this user
    const [edgesResult, logsResult, macroLogsResult] = await Promise.all([
      supabaseAdmin
        .from("edges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabaseAdmin
        .from("macro_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
    ]);

    if (edgesResult.error) {
      console.error("Failed to fetch edges:", edgesResult.error);
      return NextResponse.json({ error: "Failed to fetch edges" }, { status: 500 });
    }

    if (logsResult.error) {
      console.error("Failed to fetch logs:", logsResult.error);
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }

    if (macroLogsResult.error) {
      console.error("Failed to fetch macro logs:", macroLogsResult.error);
      return NextResponse.json({ error: "Failed to fetch macro logs" }, { status: 500 });
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      stats: {
        totalEdges: edgesResult.data?.length || 0,
        totalLogs: logsResult.data?.length || 0,
        totalMacroLogs: macroLogsResult.data?.length || 0,
      },
      edges: edgesResult.data || [],
      logs: logsResult.data || [],
      macroLogs: macroLogsResult.data || [],
    };

    // Store backup in Supabase Storage
    const date = new Date().toISOString().split("T")[0];
    const filename = `backups/${user.id}/${date}.json`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("backups")
      .upload(filename, JSON.stringify(backup, null, 2), {
        contentType: "application/json",
        upsert: true, // Overwrite if exists (same day)
      });

    if (uploadError) {
      // If bucket doesn't exist, try to create it
      if (uploadError.message.includes("Bucket not found")) {
        const { error: createBucketError } = await supabaseAdmin.storage.createBucket("backups", {
          public: false,
        });

        if (createBucketError) {
          console.error("Failed to create backup bucket:", createBucketError);
          // Still return success with backup data - user can manually save
          return NextResponse.json({
            success: true,
            warning: "Could not store in Supabase Storage - bucket creation failed",
            backup,
          });
        }

        // Retry upload after creating bucket
        const { error: retryError } = await supabaseAdmin.storage
          .from("backups")
          .upload(filename, JSON.stringify(backup, null, 2), {
            contentType: "application/json",
            upsert: true,
          });

        if (retryError) {
          console.error("Failed to upload backup after bucket creation:", retryError);
          return NextResponse.json({
            success: true,
            warning: "Could not store in Supabase Storage",
            backup,
          });
        }
      } else {
        console.error("Failed to upload backup:", uploadError);
        return NextResponse.json({
          success: true,
          warning: "Could not store in Supabase Storage",
          backup,
        });
      }
    }

    console.log(`Backup created successfully: ${filename}`);

    return NextResponse.json({
      success: true,
      message: `Backup stored at ${filename}`,
      stats: backup.stats,
    });
  } catch (error) {
    console.error("Auto backup error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
