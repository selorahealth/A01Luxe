import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/site/Icon";
import { formatMoney, padImages, slugify } from "@/lib/format";
import { uploadMedia } from "@/lib/upload";

type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  price_cents: number;
  description: string | null;
  sizes: string[];
  stock: number;
  sold_out: boolean;
  images: string[];
  featured: boolean;
  cc: string | null;
};

type Cat = { id: string; name: string; slug: string };
type Sub = { id: string; name: string; slug: string; category_id: string; kind: string };

export function ProductsTab() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort")).data as Cat[],
  });
  const { data: subs } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => (await supabase.from("subcategories").select("*")).data as Sub[],
  });
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const ch = supabase
      .channel("admin-products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-products"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Deleted");
  }

  const target = editing ?? (creating ? emptyProduct() : null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <CatManager cats={cats ?? []} subs={subs ?? []} />
        <button className="btn-primary shrink-0" onClick={() => setCreating(true)}>
          <Icon name="add-outline" size={18} /> New product
        </button>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[64px_1fr_120px_100px_100px_120px] gap-3 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          <div />
          <div>Product</div>
          <div>Brand</div>
          <div>Price</div>
          <div>Stock</div>
          <div className="text-right">Actions</div>
        </div>
        {(products ?? []).map((p) => {
          const img = padImages(p.images)[0];
          return (
            <div key={p.id} className="grid md:grid-cols-[64px_1fr_120px_100px_100px_120px] gap-3 items-center p-3 border-b border-border last:border-0">
              <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden">
                {img && <img src={img} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
              </div>
              <div className="text-sm">{p.brand ?? "—"}</div>
              <div className="text-sm font-medium">{formatMoney(p.price_cents)}</div>
              <div className="text-sm">
                {p.sold_out || p.stock <= 0 ? (
                  <span className="text-destructive font-medium">Sold Out</span>
                ) : (
                  <span>{p.stock} left</span>
                )}
              </div>
              <div className="flex justify-end gap-1">
                <button onClick={() => setEditing(p)} aria-label="Edit" className="h-9 w-9 grid place-items-center rounded-full hover:bg-foreground/5">
                  <Icon name="create-outline" size={18} />
                </button>
                <button onClick={() => remove(p.id)} aria-label="Delete" className="h-9 w-9 grid place-items-center rounded-full hover:bg-destructive/10 text-destructive">
                  <Icon name="trash-outline" size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {(products ?? []).length === 0 && (
          <div className="p-10 text-center text-muted-foreground">No products yet.</div>
        )}
      </div>

      <AnimatePresence>
        {target && (
          <ProductDrawer
            product={target}
            cats={cats ?? []}
            subs={subs ?? []}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function emptyProduct(): Product {
  return {
    id: "",
    name: "",
    slug: "",
    brand: "",
    category_id: null,
    subcategory_id: null,
    price_cents: 0,
    description: "",
    sizes: [],
    stock: 0,
    sold_out: false,
    images: [],
    featured: false,
    cc: "",
  };
}

function ProductDrawer({
  product,
  cats,
  subs,
  onClose,
}: {
  product: Product;
  cats: Cat[];
  subs: Sub[];
  onClose: () => void;
}) {
  const [p, setP] = useState<Product>(product);
  const [busy, setBusy] = useState(false);
  const isNew = !p.id;

  async function save() {
    if (!p.name.trim()) return toast.error("Name is required");
    const slug = p.slug?.trim() || slugify(p.name);
    setBusy(true);
    const payload = {
      name: p.name.trim(),
      slug,
      brand: p.brand || null,
      category_id: p.category_id,
      subcategory_id: p.subcategory_id,
      price_cents: Math.max(0, Math.round(Number(p.price_cents) || 0)),
      description: p.description || null,
      sizes: p.sizes,
      stock: Math.max(0, Math.round(Number(p.stock) || 0)),
      sold_out: p.sold_out,
      images: p.images.filter(Boolean).slice(0, 4),
      featured: p.featured,
      cc: p.cc?.trim() || null,
    };
    const q = isNew
      ? supabase.from("products").insert(payload)
      : supabase.from("products").update(payload).eq("id", p.id);
    const { error } = await q;
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(isNew ? "Created" : "Updated");
      onClose();
    }
  }

  const relevantSubs = subs.filter((s) => s.category_id === p.category_id);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 240 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-background z-50 flex flex-col shadow-2xl"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{isNew ? "New product" : "Edit product"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-foreground/5">
            <Icon name="close-outline" size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <TF label="Name" value={p.name} onChange={(v) => setP({ ...p, name: v })} />
          <TF label="Slug (optional)" value={p.slug} onChange={(v) => setP({ ...p, slug: v })} />
          <TF label="Brand (or leave empty for unbranded)" value={p.brand ?? ""} onChange={(v) => setP({ ...p, brand: v })} />
          <TF label="CC — Source store (internal · not shown to customers)" value={p.cc ?? ""} onChange={(v) => setP({ ...p, cc: v })} />
          <TF label="Description" value={p.description ?? ""} onChange={(v) => setP({ ...p, description: v })} textarea />
          <div className="grid grid-cols-2 gap-3">
            <NF label="Price (cents)" value={p.price_cents} onChange={(v) => setP({ ...p, price_cents: v })} />
            <NF label="Stock" value={p.stock} onChange={(v) => setP({ ...p, stock: v })} />
          </div>
          <TF label="Sizes (comma separated)" value={p.sizes.join(",")} onChange={(v) => setP({ ...p, sizes: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Category" value={p.category_id ?? ""} options={[{ v: "", l: "—" }, ...cats.map((c) => ({ v: c.id, l: c.name }))]} onChange={(v) => setP({ ...p, category_id: v || null, subcategory_id: null })} />
            <SelectField label="Subcategory" value={p.subcategory_id ?? ""} options={[{ v: "", l: "—" }, ...relevantSubs.map((s) => ({ v: s.id, l: s.name }))]} onChange={(v) => setP({ ...p, subcategory_id: v || null })} />
          </div>
          <ToggleRow label="Mark as sold out" value={p.sold_out} onChange={(v) => setP({ ...p, sold_out: v })} />
          <ToggleRow label="Featured" value={p.featured} onChange={(v) => setP({ ...p, featured: v })} />
          <ImageUploader
            images={p.images}
            onChange={(imgs) => setP({ ...p, images: imgs })}
          />
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={save} disabled={busy} className="btn-primary w-full">
            {busy ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function TF({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 ring-primary/30" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 ring-primary/30" />
      )}
    </div>
  );
}
function NF({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 ring-primary/30"
      />
    </div>
  );
}
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 ring-primary/30">
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );
}
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full relative transition-colors ${value ? "bg-primary" : "bg-foreground/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function CatManager({ cats, subs }: { cats: Cat[]; subs: Sub[] }) {
  const [open, setOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState<{ name: string; category_id: string; kind: string }>({ name: "", category_id: "", kind: "type" });
  const qc = useQueryClient();

  async function addCat() {
    if (!newCat.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCat.trim(), slug: slugify(newCat), sort: cats.length });
    if (error) toast.error(error.message);
    else {
      setNewCat("");
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      qc.invalidateQueries({ queryKey: ["nav-categories"] });
    }
  }
  async function delCat(id: string) {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
  }
  async function addSub() {
    if (!newSub.name.trim() || !newSub.category_id) return;
    const { error } = await supabase.from("subcategories").insert({ name: newSub.name.trim(), slug: slugify(newSub.name), category_id: newSub.category_id, kind: newSub.kind });
    if (error) toast.error(error.message);
    else {
      setNewSub({ name: "", category_id: newSub.category_id, kind: newSub.kind });
      qc.invalidateQueries({ queryKey: ["admin-subs"] });
      qc.invalidateQueries({ queryKey: ["nav-categories"] });
    }
  }
  async function delSub(id: string) {
    if (!confirm("Delete this subcategory?")) return;
    await supabase.from("subcategories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-subs"] });
  }

  return (
    <div className="flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 hover:bg-foreground/5"
      >
        <Icon name="pricetags-outline" size={16} /> Categories & subcategories
        <Icon name={open ? "chevron-up-outline" : "chevron-down-outline"} size={14} />
      </button>
      {open && (
        <div className="mt-3 rounded-2xl bg-card border border-border p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {cats.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                  {c.name}
                  <button onClick={() => delCat(c.id)} className="text-muted-foreground hover:text-destructive"><Icon name="close-outline" size={14} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
              <button onClick={addCat} className="btn-primary text-sm py-2">Add</button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Subcategories</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {subs.map((s) => {
                const cat = cats.find((c) => c.id === s.category_id);
                return (
                  <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <span className="text-muted-foreground">{cat?.name}/</span>{s.name} <span className="text-muted-foreground">({s.kind})</span>
                    <button onClick={() => delSub(s.id)} className="text-muted-foreground hover:text-destructive"><Icon name="close-outline" size={12} /></button>
                  </span>
                );
              })}
            </div>
            <div className="grid sm:grid-cols-[1fr_1fr_120px_auto] gap-2">
              <input value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} placeholder="Subcategory name" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
              <select value={newSub.category_id} onChange={(e) => setNewSub({ ...newSub, category_id: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="">Choose category</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={newSub.kind} onChange={(e) => setNewSub({ ...newSub, kind: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="type">type</option>
                <option value="brand">brand</option>
              </select>
              <button onClick={addSub} className="btn-primary text-sm py-2">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}