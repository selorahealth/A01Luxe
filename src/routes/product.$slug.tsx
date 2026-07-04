import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Icon } from "@/components/site/Icon";
import { formatMoney, padImages } from "@/lib/format";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Couldn't load product</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Link to="/" className="mt-4 inline-block underline">
          Back to shop
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">Product not found</h1>
        <Link to="/" className="mt-4 inline-block underline">
          Back to shop
        </Link>
      </div>
    </div>
  ),
});

type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price_cents: number;
  description: string | null;
  sizes: string[];
  stock: number;
  sold_out: boolean;
  images: string[];
  purchases: number;
};

type Review = { id: string; name: string; rating: number; comment: string | null; created_at: string };

function autoDescription(p: Product) {
  const brand = p.brand ? `${p.brand} ` : "";
  return `The ${brand}${p.name} is a small-batch sneaker built for everyday wear. Premium materials, cushioned footbed, and a silhouette that plays with everything in your rotation.`;
}

function derivedRating(p: Product, reviews: Review[]) {
  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    return { value: avg, count: reviews.length, label: `${reviews.length} review${reviews.length === 1 ? "" : "s"}` };
  }
  const buyers = p.purchases ?? 0;
  const value = Math.min(5, 3 + Math.log10(buyers + 1));
  return { value, count: buyers, label: buyers > 0 ? `Based on ${buyers} buyer${buyers === 1 ? "" : "s"}` : "New arrival" };
}

function ProductPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data as Product;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id,name,rating,comment,created_at")
        .eq("product_id", product!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Review[];
    },
  });

  useEffect(() => {
    if (!product?.id) return;
    const ch = supabase
      .channel(`product-${product.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${product.id}` },
        () => qc.invalidateQueries({ queryKey: ["product", slug] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [product?.id, qc, slug]);

  if (isLoading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (error) throw error;
  if (!product) throw notFound();

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Icon name="chevron-back-outline" size={16} /> Back
          </Link>
          <div className="mt-4 grid md:grid-cols-2 gap-8">
            <ImageSlider images={padImages(product.images)} name={product.name} soldOut={product.sold_out || product.stock <= 0} />
            <BuyPanel product={product} reviews={reviews ?? []} />
          </div>

          <Reviews productId={product.id} reviews={reviews ?? []} onNew={() => qc.invalidateQueries({ queryKey: ["reviews", product.id] })} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function ImageSlider({ images, name, soldOut }: { images: string[]; name: string; soldOut: boolean }) {
  const [i, setI] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  if (images.length === 0) {
    return <div className="aspect-square rounded-3xl bg-muted grid place-items-center text-muted-foreground">No image</div>;
  }
  const next = () => setI((v) => (v + 1) % images.length);
  const prev = () => setI((v) => (v - 1 + images.length) % images.length);
  return (
    <div>
      <div
        className="relative aspect-square rounded-3xl overflow-hidden bg-card"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX == null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (dx < -40) next();
          else if (dx > 40) prev();
          setTouchX(null);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={i}
            src={images[i]}
            alt={`${name} ${i + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        {soldOut && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-foreground text-background">
            Sold Out
          </div>
        )}
        <button
          onClick={prev}
          aria-label="Previous"
          className="hidden sm:grid absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
        >
          <Icon name="chevron-back-outline" size={20} />
        </button>
        <button
          onClick={next}
          aria-label="Next"
          className="hidden sm:grid absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
        >
          <Icon name="chevron-forward-outline" size={20} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {images.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`aspect-square rounded-xl overflow-hidden border-2 ${i === idx ? "border-primary" : "border-transparent"}`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function BuyPanel({ product, reviews }: { product: Product; reviews: Review[] }) {
  const cart = useCart();
  const [size, setSize] = useState<string | undefined>(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const soldOut = product.sold_out || product.stock <= 0;
  const rating = derivedRating(product, reviews);
  const description = product.description?.trim() || autoDescription(product);

  return (
    <div>
      {product.brand && (
        <div className="text-xs uppercase tracking-widest text-primary font-semibold">{product.brand}</div>
      )}
      <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold">{product.name}</h1>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <Icon
              key={n}
              name={n < Math.round(rating.value) ? "star" : "star-outline"}
              size={16}
              style={{ color: "var(--primary)" }}
            />
          ))}
        </div>
        <span className="text-muted-foreground">
          {rating.value.toFixed(1)} · {rating.label}
        </span>
      </div>
      <div className="mt-4 text-3xl font-display font-bold">{formatMoney(product.price_cents)}</div>
      <p className="mt-4 text-muted-foreground leading-relaxed">{description}</p>

      {product.sizes.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Size</div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h-10 min-w-[48px] px-3 rounded-full border ${
                  size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-border">
          <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="h-11 w-11 grid place-items-center">
            <Icon name="remove-outline" size={16} />
          </button>
          <span className="w-10 text-center">{qty}</span>
          <button
            onClick={() => setQty((v) => Math.min(product.stock || 99, v + 1))}
            className="h-11 w-11 grid place-items-center"
          >
            <Icon name="add-outline" size={16} />
          </button>
        </div>
        <button
          disabled={soldOut}
          onClick={() =>
            cart.add({
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price_cents: product.price_cents,
              image: padImages(product.images)[0] ?? "",
              size,
              qty,
              maxStock: product.stock,
            })
          }
          className="btn-primary flex-1 disabled:opacity-60"
        >
          {soldOut ? "Sold Out" : "Add to Cart"}
          {!soldOut && <Icon name="bag-add-outline" size={18} />}
        </button>
      </div>
      {!soldOut && (
        <p className="mt-2 text-xs text-muted-foreground">{product.stock} left in stock</p>
      )}
    </div>
  );
}

function Reviews({
  productId,
  reviews,
  onNew,
}: {
  productId: string;
  reviews: Review[];
  onNew: () => void;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await supabase.from("reviews").insert({ product_id: productId, name: name.trim(), rating, comment: comment.trim() || null });
    setBusy(false);
    setName("");
    setComment("");
    setRating(5);
    onNew();
  }

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-bold">Reviews</h2>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet. Be the first.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.name}</span>
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Icon
                      key={n}
                      name={n < r.rating ? "star" : "star-outline"}
                      size={14}
                      style={{ color: "var(--primary)" }}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-5 space-y-3 h-fit">
          <h3 className="font-display font-semibold">Leave a review</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 ring-primary/30"
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
              >
                <Icon
                  name={n <= rating ? "star" : "star-outline"}
                  size={22}
                  style={{ color: "var(--primary)" }}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How were they?"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 ring-primary/30"
          />
          <button className="btn-primary w-full" disabled={busy}>
            Post review
          </button>
        </form>
      </div>
    </section>
  );
}