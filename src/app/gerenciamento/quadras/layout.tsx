import { QuadrasNav } from "@/components/gerenciamento/quadras/quadras-nav";

export default function QuadrasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:flex-row">
      <QuadrasNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
