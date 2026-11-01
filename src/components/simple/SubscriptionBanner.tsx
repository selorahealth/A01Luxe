import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSimpleStats } from "@/lib/simple-admin/simple.functions";
import { useSiteSettings } from "@/lib/settings";
import { formatBase } from "@/lib/currency";
import { Icon } from "@/components/site/Icon";

export const SUBSCRIPTION_THRESHOLD_NAIRA = 250_000;
export const SUBSCRIPTION_PRICE_NAIRA = 100_000;
const ACK_KEY = "a01luxe_sub_ack_at";
const ACK_HIDE_DAYS = 90;

/**
 * Prominent renewal reminder for the simplified (non-technical) dashboard,
 * also shown on the Super Admin dashboard. Appears once total revenue passes
 * ₦250,000; "Renew Subscription" opens WhatsApp; acknowledged renewals hide
 * the banner for 90 days.
 */
export function SubscriptionBanner({ className }: { className?: string }) {
  const { data: settings } = useSiteSettings();
  const { data: stats } = useQuery({
    queryKey: ["simple-stats"],
    queryFn: () => getSimpleStats(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const [ackedAt, setAckedAt] = useState<number>(0);
  useEffect(() => {
    try {
      setAckedAt(Number(localStorage.getItem(ACK_KEY) || 0) || 0);
    } catch {
      setAckedAt(0);
    }
  }, []);

  const revenueNaira = Math.round((stats?.revenueCents ?? 0) / 100);
  const qualifies = revenueNaira >= SUBSCRIPTION_THRESHOLD_NAIRA;
  const recentlyAcked = ackedAt > 0 && Date.now() - ackedAt < ACK_HIDE_DAYS * 864e5;
  if (!stats || !qualifies || recentlyAcked) return null;

  const waNumber = (settings?.payment?.whatsappNumber || "").replace(/\D/g, "");
  const renewHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hello ${settings?.brand || "A01Luxe"}, I want to renew the website management subscription (₦${SUBSCRIPTION_PRICE_NAIRA.toLocaleString("en-NG")} for 3 months).`,
      )}`
    : "#";

  const ack = () => {
    const now = Date.now();
    try {
      localStorage.setItem(ACK_KEY, String(now));
    } catch {
      // ignore
    }
    setAckedAt(now);
  };

  return (
    <div className={`bg-primary text-primary-foreground p-4 sm:p-5 ${className ?? ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-display text-base sm:text-lg font-bold uppercase tracking-wide">
            <Icon name="warning-outline" size={20} />
            Subscription renewal due
          </div>
          <p className="mt-1 text-sm leading-relaxed">
            Your store has made <strong>{formatBase(stats.revenueCents)}</strong> in sales — past the{" "}
            {formatBase(SUBSCRIPTION_THRESHOLD_NAIRA * 100)} mark. Please renew website management:{" "}
            <strong>₦{SUBSCRIPTION_PRICE_NAIRA.toLocaleString("en-NG")} for 3 months</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={renewHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-primary-foreground text-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wide"
          >
            <Icon name="logo-whatsapp" size={18} /> Renew Subscription
          </a>
          <button
            onClick={ack}
            className="px-3 py-2.5 text-xs underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            Dismiss 90 days
          </button>
        </div>
      </div>
    </div>
  );
}
