import {
  Header,
  Hero,
  Capabilities,
  HowItWorks,
  Integrations,
  Testimonial,
  CTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <Hero />
        <Capabilities />
        <HowItWorks />
        <Integrations />
        <Testimonial />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
