import { SiteHeaderApp } from "@/components/site-header-app";

export default function ContatoLayout({
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
