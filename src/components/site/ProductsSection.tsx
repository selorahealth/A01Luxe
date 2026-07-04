import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductRow } from "./ProductCard";
import { motion } from "framer-motion";

async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,brand,price_cents,images,stock,sold_out,category_id,subcategory_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as (ProductRow & { category_id: string | null; subcategory_id: string | null })[];
}

async function fetchTaxonomy() {
  const [c, s] = await Promise.all([
    supabase.from("categories").select("id,slug,name").order("sort"),
    supabase.from("subcategories").select("id,slug,name,category_id,kind"),
  ]);
  return { cats: c.data ?? [], subs: s.data ?? [] };
}

export function ProductsSection({
  categorySlug,
  subSlug,
}: {
  categorySlug?: string;
  subSlug?: string;
}) {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: tax } = useQuery({ queryKey: ["taxonomy"], queryFn: fetchTaxonomy });
  const [tab, setTab] = useState<string>("all");

  useEffect(() => {
    const ch = supabase
      .channel("products-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => qc.invalidateQueries({ queryKey: ["products"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (categorySlug && tax) {
      const cat = tax.cats.find((c) => c.slug === categorySlug);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (subSlug && tax) {
      const sub = tax.subs.find((s) => s.slug === subSlug);
      if (sub) list = list.filter((p) => p.subcategory_id === sub.id);
    }
    if (tab === "in-stock") list = list.filter((p) => !p.sold_out && p.stock > 0);
    if (tab === "sold-out") list = list.filter((p) => p.sold_out || p.stock <= 0);
    return list;
  }, [products, tax, categorySlug, subSlug, tab]);

  return (
    <section id="shop" className="relative py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <div className="text-sm uppercase tracking-widest text-primary font-medium">
              The Collection
            </div>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold">
              Fresh pairs, freshly dropped
            </h2>
          </div>
          <div className="inline-flex rounded-full border border-border p-1 bg-card">
            {[
              { id: "all", label: "All" },
              { id: "in-stock", label: "In stock" },
              { id: "sold-out", label: "Sold out" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No products yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}