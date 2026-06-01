import { CookieBanner } from "@/components/legal/CookieBanner";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { JsonLd, publicSiteJsonLdGraph } from "@/lib/seo/json-ld";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-mesh flex min-h-dvh flex-col">
      <JsonLd data={publicSiteJsonLdGraph()} />
      <SkipToContent />
      <SiteHeader />
      <main
        id="main-content"
        className="flex-1 overflow-x-hidden pb-nav lg:pb-0"
      >
        {children}
      </main>
      <SiteFooter />
      <MobileBottomNav />
      <SiteChrome aboveMobileNav />
      <CookieBanner />
    </div>
  );
}
