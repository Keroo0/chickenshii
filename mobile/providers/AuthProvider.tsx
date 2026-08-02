import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { supabase } from "../services/supabase";
import type { StaffRole } from "../types";
import { getRoleFromUser } from "../utils/auth";

interface AuthContextValue {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  role: StaffRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      setInitialized(true);
      return;
    }

    let active = true;
    let receivedAuthEvent = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      receivedAuthEvent = true;
      setSession(nextSession);
      setInitialized(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!receivedAuthEvent) setSession(data.session);
      setInitialized(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const role = getRoleFromUser(user);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user,
      role,
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [initialized, role, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
