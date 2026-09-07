import { createClient } from "@/lib/supabase/client";

export const authService = {
  signIn(email: string, password: string) {
    return createClient().auth.signInWithPassword({ email, password });
  },
  signUp(email: string, password: string) {
    return createClient().auth.signUp({ email, password });
  },
};
