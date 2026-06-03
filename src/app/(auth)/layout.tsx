import { CookieBanner } from "@/components/legal/CookieBanner";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipToContent } from "@/components/layout/SkipToContent";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-mesh flex min-h-dvh flex-col">
      <SkipToContent />
      <SiteHeader />
      <SiteChrome />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="content-narrow w-full">{children}</div>
      </main>
      <CookieBanner />
    </div>
  );
}
