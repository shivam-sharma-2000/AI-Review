import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FAQ } from "@/components/landing/faq";
import { CtaBand } from "@/components/landing/cta-band";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <FAQ />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
