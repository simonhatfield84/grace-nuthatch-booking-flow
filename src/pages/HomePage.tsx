
import React from 'react';
import Header from '@/components/homepage/Header';
import HeroSection from '@/components/homepage/HeroSection';
import AboutSection from '@/components/homepage/AboutSection';
import DevelopmentJournal from '@/components/homepage/DevelopmentJournal';
import StatsSection from '@/components/homepage/StatsSection';
import ContactSection from '@/components/homepage/ContactSection';
import Footer from '@/components/homepage/Footer';
import AvatarGenerator from '@/components/AvatarGenerator';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-grace-background to-grace-light dark:from-gray-900 dark:to-gray-800">
      <Header />
      <HeroSection />
      
      {/* Temporary Avatar Generator - Remove after generating avatars */}
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <AvatarGenerator />
      </div>
      
      <AboutSection />
      <DevelopmentJournal />
      <StatsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default HomePage;
