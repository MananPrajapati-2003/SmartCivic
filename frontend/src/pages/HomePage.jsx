import React from "react";
import HeroSection from "../components/home/HeroSection";
import BenefitsSection from "../components/home/BenefitsSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import ProblemCardsSection from "../components/home/ProblemCardsSection";
import ContactSection from "../components/home/ContactSection";

const HomePage = () => {
  return (
    <div className="w-full min-h-screen bg-black text-white">
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <ProblemCardsSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
