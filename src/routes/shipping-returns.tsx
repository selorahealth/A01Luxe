import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/shipping-returns")({
  head: () => ({ meta: [{ title: "Shipping & Returns — ShoeLuxe" }] }),
  component: () => (
    <PageShell title="Shipping & Returns" eyebrow="// Policies">
      <Prose>
        <h3 className="font-display uppercase text-xl font-black text-foreground">Shipping</h3>
        <p>Orders are dispatched within 1 business day of confirmed payment. Local: 2–5 business days. International: 7–14 business days.</p>
        <p>Tracking updates are sent by WhatsApp and viewable on the Track Order page.</p>
        <h3 className="font-display uppercase text-xl font-black text-foreground mt-8">Returns & Exchanges</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Unworn pairs in original box eligible within 7 days of delivery.</li>
          <li>Size exchanges are free where stock allows.</li>
          <li>Refunds are processed to the original payment method within 5 business days.</li>
          <li>Sale items are final sale unless faulty.</li>
        </ul>
      </Prose>
    </PageShell>
  ),
});
