import { useSiteSettings } from "@/lib/settings";
import { Icon } from "./Icon";

export function Footer() {
  const { data: s } = useSiteSettings();
  const f = s?.footer;
  const brand = s?.brand ?? "ShoeLuxe";
  const socials = f?.socials ?? {};

  return (
    <footer className="px-4 sm:px-6 pb-6">
      <div className="max-w-7xl mx-auto rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(circle at 90% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.3), transparent 50%)",
          }}
        />
        <div className="relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 justify-center">
              <div className="h-8 w-8 rounded-full bg-primary-foreground text-primary grid place-items-center font-display font-bold">
                {brand.charAt(0)}
              </div>
              <span className="font-display text-2xl font-bold">{brand}</span>
            </div>
            <p className="mt-1 text-sm text-primary-foreground/70">
              {s?.tagline ?? "Sneakers, elevated."}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 max-w-md mx-auto flex flex-col sm:flex-row gap-2"
            >
              <input
                placeholder="Join our newsletter"
                className="flex-1 rounded-full bg-background text-foreground px-4 py-2.5 text-sm outline-none"
              />
              <button className="rounded-full bg-primary-foreground text-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90">
                Subscribe
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <p className="text-primary-foreground/80 whitespace-pre-line">
                {f?.address ?? ""}
                {"\n"}
                {f?.phone ?? ""}
                {"\n"}
                {f?.email ?? ""}
              </p>
              <div className="flex gap-2 mt-3">
                {socials.instagram && (
                  <a href={socials.instagram} aria-label="Instagram" className="h-8 w-8 rounded-full bg-primary-foreground/10 grid place-items-center hover:bg-primary-foreground/20">
                    <Icon name="logo-instagram" size={16} />
                  </a>
                )}
                {socials.tiktok && (
                  <a href={socials.tiktok} aria-label="TikTok" className="h-8 w-8 rounded-full bg-primary-foreground/10 grid place-items-center hover:bg-primary-foreground/20">
                    <Icon name="logo-tiktok" size={16} />
                  </a>
                )}
                {socials.facebook && (
                  <a href={socials.facebook} aria-label="Facebook" className="h-8 w-8 rounded-full bg-primary-foreground/10 grid place-items-center hover:bg-primary-foreground/20">
                    <Icon name="logo-facebook" size={16} />
                  </a>
                )}
              </div>
            </div>
            {(f?.columns ?? []).map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-3">{col.title}</h4>
                <ul className="space-y-1.5 text-primary-foreground/80">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <a href={l.href} className="hover:text-primary-foreground">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-primary-foreground/60">
            {f?.copyright ?? `© ${new Date().getFullYear()} ${brand}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}