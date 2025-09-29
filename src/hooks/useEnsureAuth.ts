import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Ensures there is an authenticated session for RLS-protected operations.
 * - If a user exists, returns it.
 * - If not, tries to sign in anonymously (if available in current supabase-js version).
 * - Returns the authenticated user or null if it couldn't authenticate.
 */
export async function ensureAuth(): Promise<User | null> {
  try {
    // 1) Try current user
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) return userData.user;

    // 2) Try current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) return sessionData.session.user;

    // 3) Try anonymous sign-in if supported
    const authAny = supabase.auth as any;
    if (typeof authAny?.signInAnonymously === "function") {
      const { data, error } = await authAny.signInAnonymously();
      if (error) {
        console.warn("Anonymous sign-in failed:", error);
        return null;
      }
      return data?.user ?? null;
    }

    return null;
  } catch (e) {
    console.warn("ensureAuth error:", e);
    return null;
  }
}
