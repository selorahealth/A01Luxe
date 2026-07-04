import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createStaff, removeStaff, listStaff } from "@/lib/staff.functions";
import { Icon } from "@/components/site/Icon";

export function StaffsTab({ currentRole }: { currentRole: "admin" | "staff" }) {
  const qc = useQueryClient();
  const list = useServerFn(listStaff);
  const create = useServerFn(createStaff);
  const remove = useServerFn(removeStaff);
  const { data, isLoading } = useQuery({ queryKey: ["staff-list"], queryFn: () => list() });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [busy, setBusy] = useState(false);

  if (currentRole !== "admin") {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <p className="text-muted-foreground">Only admins can manage staff.</p>
      </div>
    );
  }

  async function add() {
    setBusy(true);
    try {
      await create({ data: { email, password, role } });
      toast.success("Staff created");
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function del(uid: string) {
    if (!confirm("Remove this user?")) return;
    try {
      await remove({ data: { userId: uid } });
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function randomPassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setPassword(s);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="font-display font-semibold mb-3">Add staff / admin</h3>
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          <div className="flex gap-2">
            <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            <button type="button" onClick={randomPassword} className="rounded-xl border border-border px-3 text-sm hover:bg-foreground/5" aria-label="Generate">
              <Icon name="key-outline" size={16} />
            </button>
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
          <button onClick={add} disabled={busy || !email || !password} className="btn-primary text-sm py-2 disabled:opacity-60">Add</button>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading && <div className="p-6 text-muted-foreground">Loading…</div>}
        {(data ?? []).map((u) => (
          <div key={u.userId} className="p-3 flex items-center gap-3 border-b border-border last:border-0">
            <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center">
              <Icon name="person-outline" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{u.email}</div>
              <div className="text-xs text-muted-foreground">Added {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${u.role === "admin" ? "border-primary text-primary bg-primary/10" : "border-border"}`}>{u.role}</span>
            <button onClick={() => del(u.userId)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-destructive/10 text-destructive" aria-label="Remove">
              <Icon name="trash-outline" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}