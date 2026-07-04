import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/components/site/Icon";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

type Order = { id: string; order_id: string; total_cents: number; created_at: string; customer: { name?: string } };

export function NotificationsTab() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from("orders")
      .select("id,order_id,total_cents,created_at,customer")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setOrders((data ?? []) as unknown as Order[]));
    const ch = supabase
      .channel("notify-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        const o = p.new as unknown as Order;
        setOrders((prev) => [o, ...prev].slice(0, 30));
        toast.success(`New order ${o.order_id} · ${formatMoney(o.total_cents)}`);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="space-y-3">
      {orders.length === 0 && (
        <div className="rounded-2xl bg-card border border-border p-10 text-center text-muted-foreground">
          You'll see new order alerts here in real time.
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center">
            <Icon name="cart-outline" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">New order · {o.order_id}</div>
            <div className="text-xs text-muted-foreground">
              {o.customer?.name ?? "Customer"} · {new Date(o.created_at).toLocaleString()}
            </div>
          </div>
          <div className="font-semibold shrink-0">{formatMoney(o.total_cents)}</div>
        </div>
      ))}
    </div>
  );
}