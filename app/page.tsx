import { Cta, Faq, Features, Footer, Hero, HowItWorks, Nav, Pricing, UseCases } from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
