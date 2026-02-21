import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SolarScrollAnimation from "@/components/landing/SolarScrollAnimation";
import { StudentsSection, CollegesSection, ProfessionalsSection } from "@/components/landing/FeatureSections";
import { AISection } from "@/components/landing/AISection";
import { StatsSection, ContactSection, CTASection, Footer } from "@/components/landing/SupportSections";

export default function HomePage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#030309" }}>
      <Navbar />
      <SolarScrollAnimation>
        <HeroSection />
        <StatsSection />
      </SolarScrollAnimation>
      <StudentsSection />
      <CollegesSection />
      <ProfessionalsSection />
      <AISection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
}