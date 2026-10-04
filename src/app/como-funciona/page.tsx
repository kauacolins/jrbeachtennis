import type { Metadata } from "next";
import { HowItWorks } from "@/components/home/how-it-works";

export const metadata: Metadata = {
  title: "Como funciona | Arena JR",
  description: "Como reservar sua quadra na Arena JR, passo a passo.",
};

export default function ComoFuncionaPage() {
  return <HowItWorks />;
}
