import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "staff" | null;
export type StaffPermission = "content" | "products" | "orders" | "staffs" | "accounts" | "notifications";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  role: Role;
  permissions: StaffPermission[];
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) void loadRole(s.user.id);
      else { setRole(null); setPermissions([]); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadRole(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();

    async function loadRole(userId: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role, permissions")
        .eq("user_id", userId)
        .order("role", { ascending: true });
      if (data && data.length > 0) {
        const roles = data.map((r) => r.role);
        setRole(roles.includes("admin") ? "admin" : "staff");
        const all: StaffPermission[] = ["content", "products", "orders", "staffs", "accounts", "notifications"];
        if (roles.includes("admin")) setPermissions(all);
        else setPermissions(Array.from(new Set(data.flatMap((r) => (r.permissions ?? []) as StaffPermission[]))));
      } else {
        setRole(null);
        setPermissions([]);
      }
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        permissions,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}