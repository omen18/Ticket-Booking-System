import HeroSection      from "@/components/landing/HeroSection";
import FeaturesSection  from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingNav       from "@/components/landing/LandingNav";
import StatsSection     from "@/components/landing/StatsSection";
import IntroOverlay     from "@/components/landing/IntroOverlay";

export default function HomePage() {
  return (
    <>
      <IntroOverlay />
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />

      <section id="events"  className="h-px" />
      <section id="reviews" className="h-px" />
    </>
  );
}
