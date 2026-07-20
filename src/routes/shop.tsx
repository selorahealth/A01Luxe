import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/site/PageShell";
import { ProductsSection } from "@/components/site/ProductsSection";

const search = z.object({
  category: z.string().optional(),
  sub: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Shop — A01Luxe" },
      { name: "description", content: "Browse the full A01Luxe collection of branded and unbranded sneakers." },
      { property: "og:title", content: "Shop — A01Luxe" },
      { property: "og:description", content: "Browse the full A01Luxe collection." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category, sub } = Route.useSearch();
  return (
    <PageShell title="Shop" eyebrow="// The Full Catalog">
      <ProductsSection categorySlug={category} subSlug={sub} title="The Full Catalog" eyebrow="" />
    </PageShell>
  );
}
