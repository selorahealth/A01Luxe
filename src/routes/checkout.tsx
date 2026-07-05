import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatMoney, generateOrderId } from "@/lib/format";
import { PageShell } from "@/components/site/PageShell";
import { Icon } from "@/components/site/Icon";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(30),
  address: z.string().trim().min(5).max(500),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ShoeLuxe" }] }),
  component: Checkout,
});

function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErr(parsed.error.errors[0].message);
    if (cart.items.length === 0) return setErr("Your cart is empty.");
    setSubmitting(true);
    try {
      const orderId = generateOrderId();
      const items = cart.items.map((i) => ({
        product_id: i.productId, name: i.name, image: i.image,
        size: i.size ?? null, qty: i.qty, price_cents: i.price_cents,
      }));
      const total = cart.totalCents;
      const { error } = await supabase.from("orders").insert({
        order_id: orderId, customer: parsed.data, items,
        total_cents: total, status: "pending",
      });
      if (error) throw error;
      await Promise.all(cart.items.map((i) =>
        supabase.rpc("decrement_stock", { _product_id: i.productId, _qty: i.qty }),
      ));
      cart.clear();
      navigate({ to: "/thank-you", search: { order: orderId, total } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <PageShell title="Checkout" eyebrow="// Almost there">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center border border-dashed border-border">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link to="/shop" className="btn-primary mt-6 inline-flex">Browse sneakers <Icon name="arrow-forward-outline" size={18} /></Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Checkout" eyebrow="// Order info">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="border border-border p-6 space-y-4">
          <h2 className="font-display uppercase font-bold text-xl">Delivery Details</h2>
          {(["name", "email", "phone", "address"] as const).map((k) => (
            <div key={k}>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{k}</label>
              {k === "address" ? (
                <textarea rows={3} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="mt-1 w-full border border-border bg-card px-3 py-2 outline-none focus:border-primary" />
              ) : (
                <input type={k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="mt-1 w-full border border-border bg-card px-3 py-2 outline-none focus:border-primary" />
              )}
            </div>
          ))}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
            {submitting ? "Placing order…" : "Place order"} <Icon name="arrow-forward-outline" size={18} />
          </button>
        </form>
        <aside className="border border-border p-6 h-fit space-y-3">
          <h3 className="font-display uppercase font-bold text-lg">Summary</h3>
          <ul className="text-sm space-y-2">
            {cart.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span className="truncate">{i.qty}× {i.name}{i.size ? ` (${i.size})` : ""}</span>
                <span className="font-mono">{formatMoney(i.price_cents * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-border flex justify-between font-bold">
            <span>Total</span><span className="font-mono">{formatMoney(cart.totalCents)}</span>
          </div>
        </aside>
      </motion.div>
    </PageShell>
  );
}