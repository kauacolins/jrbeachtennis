import { SiteHeaderApp } from "@/components/site-header-app";

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeaderApp />
      <main>{children}</main>
    </>
  );
}
