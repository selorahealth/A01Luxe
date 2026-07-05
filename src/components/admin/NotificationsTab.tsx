import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/components/site/Icon";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

type Order = { id: string; order_id: string; total_cents: number; created_at: string; customer: { name?: string } };
type StockRow = { id: string; name: string; slug: string; stock: number; sold_out: boolean; low_stock_threshold: number };

export function NotificationsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { data: stock, refetch } = useQuery({
    queryKey: ["admin-stock-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,stock,sold_out,low_stock_threshold")
        .order("stock", { ascending: true });
      if (error) throw error;
      return data as StockRow[];
    },
  });

  const soldOut = (stock ?? []).filter((p) => p.sold_out || p.stock <= 0);
  const lowStock = (stock ?? []).filter((p) => !p.sold_out && p.stock > 0 && p.stock <= (p.low_stock_threshold ?? 3));

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
    const pch = supabase
      .channel("notify-products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(pch);
    };
  }, [refetch]);

  return (
    <div className="space-y-6">
      {(soldOut.length > 0 || lowStock.length > 0) && (
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Stock Alerts</h3>
          {soldOut.map((p) => (
            <div key={p.id} className="border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-destructive/15 text-destructive grid place-items-center">
                <Icon name="warning-outline" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Sold out · {p.name}</div>
                <div className="text-xs text-muted-foreground">Restock or hide from the storefront.</div>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-destructive">0 left</span>
            </div>
          ))}
          {lowStock.map((p) => (
            <div key={p.id} className="border border-primary/40 bg-primary/5 p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/15 text-primary grid place-items-center">
                <Icon name="warning-outline" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Low stock · {p.name}</div>
                <div className="text-xs text-muted-foreground">Threshold: {p.low_stock_threshold ?? 3}</div>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary">{p.stock} left</span>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Orders</h3>
      {orders.length === 0 && (
        <div className="bg-card border border-border p-10 text-center text-muted-foreground">
          You'll see new order alerts here in real time.
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="bg-card border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 text-primary grid place-items-center">
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
      </section>
    </div>
  );
}