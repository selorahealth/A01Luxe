import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./Icon";
import { useSiteSettings } from "@/lib/settings";
import { useCart } from "@/lib/cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Cat = { id: string; name: string; slug: string };
type Sub = { id: string; category_id: string; name: string; slug: string; kind: string };

async function fetchCategories() {
  const [cats, subs] = await Promise.all([
    supabase.from("categories").select("id,name,slug").order("sort"),
    supabase.from("subcategories").select("id,category_id,name,slug,kind"),
  ]);
  return {
    cats: (cats.data ?? []) as Cat[],
    subs: (subs.data ?? []) as Sub[],
  };
}

export function Navbar() {
  const { data: settings } = useSiteSettings();
  const { data: navData } = useQuery({ queryKey: ["nav-categories"], queryFn: fetchCategories, staleTime: 60_000 });
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = settings?.nav_layout ?? {
    logoPosition: "left",
    showCategories: true,
    showUserIcon: true,
    showCart: true,
  };
  const brand = settings?.brand ?? "ShoeLuxe";
  const logoUrl = settings?.logo_url;
  const cats = navData?.cats ?? [];
  const subs = navData?.subs ?? [];

  const Logo = (
    <Link to="/" className="flex items-center gap-2 min-w-0">
      {logoUrl ? (
        <img src={logoUrl} alt={brand} className="h-8 w-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold">
          {brand.charAt(0)}
        </div>
      )}
      <span className="font-display font-bold text-lg truncate">{brand}</span>
    </Link>
  );

  const CategoriesNav = nav.showCategories && cats.length > 0 && (
    <ul className="hidden md:flex items-center gap-1">
      {cats.map((c) => {
        const csubs = subs.filter((s) => s.category_id === c.id);
        return (
          <li
            key={c.id}
            className="relative"
            onMouseEnter={() => setOpenCat(c.id)}
            onMouseLeave={() => setOpenCat((v) => (v === c.id ? null : v))}
          >
            <Link
              to="/"
              search={{ category: c.slug }}
              className="px-3 py-2 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              {c.name}
            </Link>
            <AnimatePresence>
              {openCat === c.id && csubs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] rounded-2xl bg-card shadow-xl border border-border p-2 z-40"
                >
                  {["brand", "type"].map((kind) => {
                    const items = csubs.filter((s) => s.kind === kind);
                    if (items.length === 0) return null;
                    return (
                      <div key={kind} className="p-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          {kind === "brand" ? "By Brand" : "By Type"}
                        </div>
                        <ul className="space-y-0.5">
                          {items.map((s) => (
                            <li key={s.id}>
                              <Link
                                to="/"
                                search={{ category: c.slug, sub: s.slug }}
                                className="block rounded-lg px-2 py-1.5 text-sm hover:bg-foreground/5"
                              >
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );

  const Actions = (
    <div className="flex items-center gap-1 shrink-0">
      {nav.showCart && (
        <button
          aria-label="Cart"
          onClick={() => cart.setOpen(true)}
          className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-foreground/5"
        >
          <Icon name="bag-outline" size={22} />
          {cart.count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
              {cart.count}
            </span>
          )}
        </button>
      )}
      {nav.showUserIcon && (
        <Link
          to="/auth"
          aria-label="Admin"
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-foreground/5"
        >
          <Icon name="person-circle-outline" size={24} />
        </Link>
      )}
      <button
        aria-label="Menu"
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden h-10 w-10 grid place-items-center rounded-full hover:bg-foreground/5"
      >
        <Icon name={mobileOpen ? "close-outline" : "menu-outline"} size={24} />
      </button>
    </div>
  );

  const layoutClass =
    nav.logoPosition === "center"
      ? "grid grid-cols-[1fr_auto_1fr] items-center gap-4"
      : nav.logoPosition === "right"
        ? "flex items-center justify-between gap-4"
        : "flex items-center justify-between gap-4";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "py-2" : "py-3"} glass-nav`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${layoutClass}`}>
        {nav.logoPosition === "center" ? (
          <>
            <div className="min-w-0 flex items-center">{CategoriesNav}</div>
            <div className="justify-self-center">{Logo}</div>
            <div className="justify-self-end">{Actions}</div>
          </>
        ) : nav.logoPosition === "right" ? (
          <>
            <div className="min-w-0">{Actions}</div>
            <div className="hidden md:flex flex-1 justify-center">{CategoriesNav}</div>
            <div>{Logo}</div>
          </>
        ) : (
          <>
            <div className="min-w-0">{Logo}</div>
            <div className="hidden md:flex flex-1 justify-center">{CategoriesNav}</div>
            <div>{Actions}</div>
          </>
        )}
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border/40 bg-card/60"
          >
            <ul className="p-3 space-y-1">
              {cats.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/"
                    search={{ category: c.slug }}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 hover:bg-foreground/5 font-medium"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}