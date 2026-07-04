import { motion } from "framer-motion";
import { useSiteSettings } from "@/lib/settings";
import { Icon } from "./Icon";

export function CtaBand() {
  const { data } = useSiteSettings();
  const cta = data?.cta;
  return (
    <section className="py-16 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto rounded-3xl bg-primary text-primary-foreground p-8 sm:p-14 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 50%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.2), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="font-display text-2xl sm:text-4xl font-bold">
              {cta?.heading ?? "Made for the streets."}
            </h3>
            <p className="mt-2 text-primary-foreground/85">{cta?.sub ?? ""}</p>
          </div>
          <a
            href="#shop"
            className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 font-semibold hover:scale-[1.02] transition-transform shrink-0"
          >
            {cta?.button ?? "Shop All"}
            <Icon name="arrow-forward-outline" size={18} />
          </a>
        </div>
      </motion.div>
    </section>
  );
}