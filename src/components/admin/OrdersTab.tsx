import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/site/Icon";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

type Order = {
  id: string;
  order_id: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: { name: string; image: string; qty: number; price_cents: number; size?: string | null; product_id: string }[];
  total_cents: number;
  status: string;
  created_at: string;
};

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-800 border-yellow-500/30",
  paid: "bg-primary/15 text-primary border-primary/30",
  shipped: "bg-blue-500/15 text-blue-800 border-blue-500/30",
  delivered: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

export function OrdersTab() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });
  const [openOrder, setOpenOrder] = useState<Order | null>(null);

  useEffect(() => {
    const ch = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-orders"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Status set to ${status}`);
  }

  return (
    <div className="space-y-3">
      {(orders ?? []).length === 0 && (
        <div className="rounded-2xl bg-card border border-border p-10 text-center text-muted-foreground">
          No orders yet.
        </div>
      )}
      {(orders ?? []).map((o) => {
        const thumb = o.items?.[0]?.image;
        return (
          <button
            key={o.id}
            onClick={() => setOpenOrder(o)}
            className="w-full text-left rounded-2xl bg-card border border-border p-3 hover:shadow-md transition-shadow grid grid-cols-[64px_1fr_auto] gap-3 items-center"
          >
            <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden shrink-0">
              {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">{o.order_id}</span>
                <span className={`text-[10px] uppercase rounded-full border px-2 py-0.5 ${STATUS_COLOR[o.status] ?? ""}`}>
                  {o.status}
                </span>
              </div>
              <div className="text-sm truncate">
                {o.customer?.name} <span className="text-muted-foreground">· {o.items?.length ?? 0} items</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold">{formatMoney(o.total_cents)}</div>
            </div>
          </button>
        );
      })}

      <AnimatePresence>
        {openOrder && (
          <OrderModal
            order={openOrder}
            onClose={() => setOpenOrder(null)}
            onStatus={(s) => updateStatus(openOrder.id, s)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderModal({ order, onClose, onStatus }: { order: Order; onClose: () => void; onStatus: (s: string) => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="fixed inset-x-3 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[560px] max-h-[90vh] overflow-y-auto z-[60] bg-background rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Order {order.order_id}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-foreground/5">
            <Icon name="close-outline" size={22} />
          </button>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 mb-3">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Customer</h4>
          <div className="mt-1">
            <div className="font-medium">{order.customer?.name}</div>
            <div className="text-sm text-muted-foreground">{order.customer?.email}</div>
            <div className="text-sm text-muted-foreground">{order.customer?.phone}</div>
            <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">{order.customer?.address}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 mb-3">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
          <div className="space-y-2">
            {order.items?.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{i.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.size ? `Size ${i.size} · ` : ""}Qty {i.qty}
                  </div>
                </div>
                <div className="text-sm font-medium">{formatMoney(i.price_cents * i.qty)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-lg font-bold">{formatMoney(order.total_cents)}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Status</h4>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  order.status === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-foreground/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}