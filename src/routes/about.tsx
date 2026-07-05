import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — ShoeLuxe" },
    { name: "description", content: "The story behind ShoeLuxe: curated branded and unbranded sneakers, built for the streets." },
    { property: "og:title", content: "About ShoeLuxe" },
    { property: "og:description", content: "The story behind the ShoeLuxe collection." },
  ]}),
  component: () => (
    <PageShell title="About Us" eyebrow="// The Story">
      <Prose>
        <p>
          ShoeLuxe was born on the streets. We hand-pick every drop — from the loudest branded silhouettes
          to independent, unbranded builds that hit different. No filler. No hype tax.
        </p>
        <p>
          Every pair we ship is inspected end-to-end, boxed with care, and backed by real humans over WhatsApp
          — not a chatbot maze.
        </p>
        <h3 className="font-display uppercase text-xl font-black text-foreground mt-8">What we believe</h3>
        <ul className="space-y-2 list-disc pl-6">
          <li>Quality is non-negotiable — always inspected before dispatch.</li>
          <li>Prices should be fair. No hidden markups.</li>
          <li>Your feet, your rules. Branded or unbranded, both are legit.</li>
        </ul>
      </Prose>
    </PageShell>
  ),
});
