import { CookieBanner } from "@/components/legal/CookieBanner";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PageWayfinding } from "@/components/layout/PageWayfinding";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { JsonLd, localBusinessJsonLd } from "@/lib/seo/json-ld";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-mesh flex min-h-dvh flex-col">
      <JsonLd data={localBusinessJsonLd()} />
      <SkipToContent />
      <SiteHeader />
      <main
        id="main-content"
        className="flex-1 overflow-x-hidden pb-24 sm:pb-0"
      >
        {children}
        <PageWayfinding />
      </main>
      <SiteFooter />
      <MobileBottomNav />
      <SiteChrome aboveMobileNav />
      <CookieBanner />
    </div>
  );
}
