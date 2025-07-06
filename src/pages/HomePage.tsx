
import React from 'react';
import Header from '@/components/homepage/Header';
import HeroSection from '@/components/homepage/HeroSection';
import DevelopmentJournal from '@/components/homepage/DevelopmentJournal';
import StatsSection from '@/components/homepage/StatsSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import ContactSection from '@/components/homepage/ContactSection';
import Footer from '@/components/homepage/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-grace-background to-grace-light dark:from-gray-900 dark:to-gray-800">
      <Header />
      <HeroSection />
      <DevelopmentJournal />
      <StatsSection />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default HomePage;
