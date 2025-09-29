import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Ensures there is an authenticated session for RLS-protected operations.
 * - If a user/session exists, returns it.
 * - Does NOT attempt anonymous sign-in (disabled on project).
 */
export async function ensureAuth(): Promise<User | null> {
  try {
    // 1) Try current user
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) return userData.user;

    // 2) Try current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) return sessionData.session.user;

    return null;
  } catch (e) {
    console.warn("ensureAuth error:", e);
    return null;
  }
}
