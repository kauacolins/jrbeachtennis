import { ConfiguracoesNav } from "@/components/gerenciamento/configuracoes/configuracoes-nav";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row">
      <ConfiguracoesNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
