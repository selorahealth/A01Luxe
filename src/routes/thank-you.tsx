import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/lib/settings";
import { useMoney } from "@/lib/currency";
import { PageShell } from "@/components/site/PageShell";
import { Icon } from "@/components/site/Icon";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";
import { PaystackButton } from "@/components/checkout/PaystackButton";

const search = z.object({
  order: z.string(),
  total: z.coerce.number().default(0),
});

useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://js.paystack.co/v1/inline.js";
  script.async = true;
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);

export const Route = createFileRoute("/thank-you")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Thank you — A01Luxe" }, { name: "robots", content: "noindex" }] }),
  component: ThankYou,
});

function ThankYou() {
  const { order, total } = Route.useSearch();
  const { data: s } = useSiteSettings();
  const money = useMoney();
  const p = s?.payment;
  const digits = (p?.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { if (copied) { const t = setTimeout(() => setCopied(null), 1500); return () => clearTimeout(t); } }, [copied]);
  function copy(label: string, value: string) { navigator.clipboard?.writeText(value); setCopied(label); }
  const maskedAcct = p?.accountNumber ? p.accountNumber.replace(/.(?=.{4})/g, "•") : "";

  async function uploadReceipt(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "receipts");
      const { data, error } = await supabase.rpc("upload_receipt_public", {
        _order_id: order,
        _receipt_url: url,
      });
      if (error) throw error;
      if (!data) throw new Error("Order not found");
      toast.success("Receipt uploaded");
      if (digits) {
        const message = `Hi ${s?.brand ?? "A01Luxe"}! I just uploaded my receipt for order ${order} (${money.format(total)}). Receipt: ${url}`;
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Receipt upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <PageShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto h-16 w-16 border-2 border-primary text-primary grid place-items-center">
          <Icon name="checkmark-outline" size={32} />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.3em] text-primary font-bold">// Order received</div>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-black uppercase">Thank You</h1>
        <p className="mt-3 text-muted-foreground">
          Your order <span className="font-mono font-bold text-foreground">{order}</span> is pending payment. Complete the transfer below and upload your receipt.
        </p>

        <div className="mt-8 border border-border p-6 text-left space-y-3">
          <Row label="Order ID" value={order} onCopy={() => copy("order", order)} copied={copied === "order"} />
          <Row label="Amount" value={money.format(total)} />
          <PaystackButton
  orderId={order.order_id}
  amount={order.total_cents / 100}
  email={order.customer.email}
  customerName={order.customer.name}
  onSuccess={(reference) => {
    // We will add automatic status update later
    console.log("Payment successful. Reference:", reference);
  }}
/>
        </div>

        {p?.instructions && (
          <p className="mt-4 text-xs text-muted-foreground">{p.instructions}</p>
        )}

        {digits ? (
          <motion.label
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="mt-6 w-full inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-4 text-white font-black uppercase text-base sm:text-lg tracking-widest shadow-lg active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#25D366" }}
          >
            <Icon name="receipt-outline" size={22} />
            {uploading ? "Uploading receipt…" : "Upload your receipt here after payment"}
            <input
              type="file"
              accept="image/*,application/pdf"
              disabled={uploading}
              className="hidden"
              onChange={(e) => uploadReceipt(e.target.files?.[0] ?? null)}
            />
          </motion.label>
        ) : (
          <p className="mt-5 text-sm text-destructive">WhatsApp number not set. Contact us via the details in the footer.</p>
        )}

        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/track-order" search={{ id: order }} className="text-sm text-primary hover:underline">Track this order</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">Continue shopping</Link>
        </div>
      </motion.div>
    </PageShell>
  );
}

function Row({ label, value, onCopy, copied }: { label: string; value: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-sm font-bold truncate">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-primary shrink-0" aria-label="Copy">
            <Icon name={copied ? "checkmark-outline" : "copy-outline"} size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
