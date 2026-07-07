import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NavLayout = {
  logoPosition: "left" | "center" | "right";
  showCategories: boolean;
  showUserIcon: boolean;
  showCart: boolean;
};

export type HeroSettings = {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  overlay: number;
};

export type CtaSettings = { heading: string; sub: string; button: string; mediaUrl?: string };

export type FooterSettings = {
  about: string;
  address: string;
  phone: string;
  email: string;
  socials: { instagram?: string; tiktok?: string; facebook?: string; whatsappChannel?: string };
  columns: { title: string; links: { label: string; href: string }[] }[];
  copyright: string;
};

export type ThemeSettings = {
  background: string;
  primary: string;
  foreground: string;
  card: string;
  accent: string;
};

export type PaymentSettings = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  whatsappNumber: string;
  instructions: string;
  deliveryLagosCents?: number;
  deliveryOutsideCents?: number;
};

export type CurrencySettings = { symbol: string; code: string };

export type SiteSettings = {
  id: number;
  brand: string;
  tagline: string | null;
  logo_url: string | null;
  nav_layout: NavLayout;
  hero: HeroSettings;
  cta: CtaSettings;
  footer: FooterSettings;
  theme: ThemeSettings;
  payment: PaymentSettings;
  currency: CurrencySettings;
};

export const settingsQueryKey = ["site_settings"] as const;

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data as unknown as SiteSettings;
}

export function useSiteSettings() {
  return useQuery({ queryKey: settingsQueryKey, queryFn: fetchSiteSettings, staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true });
}

export function applyThemeToDocument(theme: ThemeSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--foreground", theme.foreground);
  root.style.setProperty("--card", theme.card);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--brand", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--ring", theme.primary);
}

export function ThemeApplier({ theme }: { theme?: ThemeSettings }) {
  useEffect(() => {
    if (theme) applyThemeToDocument(theme);
  }, [theme]);
  return null;
}