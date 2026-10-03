import type { Metadata } from "next";
import { SiteHeader } from "@/components/home/site-header";
import { Hero } from "@/components/home/hero";
import { SportCards } from "@/components/home/sport-cards";
import { TodaySlots } from "@/components/home/today-slots";
import { HowItWorks } from "@/components/home/how-it-works";
import { Pricing } from "@/components/home/pricing";
import { Benefits } from "@/components/home/benefits";
import { Amenities } from "@/components/home/amenities";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";
import { SiteFooter } from "@/components/home/site-footer";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Arena JR | Reserve sua quadra de beach tennis",
  description:
    "Reserve quadras de beach tennis, futebol e vôlei na Arena JR. Horários livres em tempo real, confirmação em poucos toques.",
  openGraph: {
    title: "Arena JR | Reserve sua quadra de beach tennis",
    description:
      "Reserve quadras de beach tennis, futebol e vôlei na Arena JR.",
    images: ["/images/hero-quadra.jpg"],
  },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SportCards />
        <TodaySlots />
        <HowItWorks />
        <Pricing />
        <Benefits />
        <Amenities />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
