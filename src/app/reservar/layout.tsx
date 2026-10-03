import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-heading text-lg font-bold tracking-tight"
          >
            Arena<span className="text-primary">JR</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/#modalidades"
              className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Modalidades
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
