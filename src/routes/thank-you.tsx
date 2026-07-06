import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/lib/settings";
import { useMoney } from "@/lib/currency";
import { PageShell } from "@/components/site/PageShell";
import { Icon } from "@/components/site/Icon";
import { useEffect, useState } from "react";

const search = z.object({
  order: z.string(),
  total: z.coerce.number().default(0),
});

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
  const waHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        `Hi ${s?.brand ?? "A01Luxe"}! I just paid for order ${order} (${money.format(total)}). Here's my receipt:`,
      )}`
    : null;
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => { if (copied) { const t = setTimeout(() => setCopied(null), 1500); return () => clearTimeout(t); } }, [copied]);
  function copy(label: string, value: string) { navigator.clipboard?.writeText(value); setCopied(label); }
  const maskedAcct = p?.accountNumber ? p.accountNumber.replace(/.(?=.{4})/g, "•") : "";

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
          {p?.bankName && <Row label="Bank" value={p.bankName} />}
          {p?.accountName && <Row label="Account name" value={p.accountName} />}
          {p?.accountNumber && (
            <Row label="Account number" value={maskedAcct} onCopy={() => copy("acct", p.accountNumber)} copied={copied === "acct"} />
          )}
        </div>

        {p?.instructions && (
          <p className="mt-4 text-xs text-muted-foreground">{p.instructions}</p>
        )}

        {waHref ? (
          <motion.a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-4 text-white font-black uppercase text-base sm:text-lg tracking-widest shadow-lg active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#25D366" }}
          >
            <Icon name="receipt-outline" size={22} />
            Upload your receipt here after payment
          </motion.a>
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
