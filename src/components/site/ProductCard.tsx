import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { formatMoney, padImages } from "@/lib/format";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price_cents: number;
  images: string[];
  stock: number;
  sold_out: boolean;
};

export function ProductCard({ p, index = 0 }: { p: ProductRow; index?: number }) {
  const img = padImages(p.images)[0];
  const soldOut = p.sold_out || p.stock <= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.04 }}
    >
      <Link
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="group block rounded-2xl bg-card overflow-hidden border border-border/60 hover:shadow-xl transition-shadow"
      >
        <div className="relative aspect-square bg-muted/50 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={p.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-muted-foreground">
              No image
            </div>
          )}
          {soldOut && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-foreground text-background">
              Sold Out
            </div>
          )}
        </div>
        <div className="p-4">
          {p.brand && (
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {p.brand}
            </div>
          )}
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <h3 className="font-display font-semibold text-base truncate">{p.name}</h3>
            <span className="font-semibold shrink-0">{formatMoney(p.price_cents)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}