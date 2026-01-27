import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/reset-edges
 *
 * Resets all edges for a fresh start:
 * 1. Deletes all logs for the authenticated user
 * 2. Resets all edge created_at dates to today
 *
 * This is a destructive operation - use with caution!
 * Requires the user to be authenticated and pass a confirmation code.
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user via session
    const authSupabase = await createAuthClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { confirmCode } = await request.json();

    // Require confirmation code to prevent accidental calls
    const expectedCode = process.env.FRESH_START_CODE || 'FRESH_START_2025';
    if (confirmCode !== expectedCode) {
      return NextResponse.json(
        { error: 'Invalid confirmation code' },
        { status: 400 }
      );
    }

    // Use service role for admin operations (to bypass RLS for bulk delete)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Use the authenticated user's ID -- never accept userId from the request body
    const userId = user.id;

    // Get today's date in ISO format
    const today = new Date().toISOString();

    // Step 1: Delete all logs for this user
    const { error: deleteLogsError, count: deletedLogsCount } = await supabase
      .from('logs')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (deleteLogsError) {
      console.error('Failed to delete logs:', deleteLogsError);
      return NextResponse.json(
        { error: 'Failed to delete logs' },
        { status: 500 }
      );
    }

    // Step 2: Reset all edge created_at dates to today
    const { error: updateEdgesError, count: updatedEdgesCount } = await supabase
      .from('edges')
      .update({ created_at: today }, { count: 'exact' })
      .eq('user_id', userId);

    if (updateEdgesError) {
      console.error('Failed to update edges:', updateEdgesError);
      return NextResponse.json(
        { error: 'Failed to update edges' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fresh start complete!',
      deletedLogs: deletedLogsCount || 0,
      updatedEdges: updatedEdgesCount || 0,
      newStartDate: today,
    });

  } catch (error) {
    console.error('Reset edges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
