import { EquipeNav } from "@/components/gerenciamento/equipe/equipe-nav";

export default function EquipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row">
      <EquipeNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
