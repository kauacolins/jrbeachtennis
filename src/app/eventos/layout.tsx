import { SiteHeaderApp } from "@/components/site-header-app";

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeaderApp />
      <main>{children}</main>
    </>
  );
}
