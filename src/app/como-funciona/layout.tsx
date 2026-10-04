import { SiteHeaderApp } from "@/components/site-header-app";

export default function ComoFuncionaLayout({
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
