
import React from 'react';
import Header from '@/components/homepage/Header';
import HeroSection from '@/components/homepage/HeroSection';
import AboutSection from '@/components/homepage/AboutSection';
import InActionSection from '@/components/homepage/InActionSection';
import DevelopmentJournal from '@/components/homepage/DevelopmentJournal';
import ArchitectureSection from '@/components/homepage/ArchitectureSection';
import StatsSection from '@/components/homepage/StatsSection';
import ContactSection from '@/components/homepage/ContactSection';
import Footer from '@/components/homepage/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-grace-background to-grace-light dark:from-gray-900 dark:to-gray-800">
      <Header />
      <HeroSection />
      <AboutSection />
      <InActionSection />
      <DevelopmentJournal />
      <ArchitectureSection />
      <StatsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default HomePage;
