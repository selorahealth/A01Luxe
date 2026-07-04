import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { ProductsSection } from "@/components/site/ProductsSection";
import { CtaBand } from "@/components/site/CtaBand";
import { Footer } from "@/components/site/Footer";

const search = z.object({
  category: z.string().optional(),
  sub: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (s) => search.parse(s),
  component: Index,
});

function Index() {
  const { category, sub } = Route.useSearch();
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProductsSection categorySlug={category} subSlug={sub} />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
