import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/homepage/Header';
import HeroSection from '@/components/homepage/HeroSection';
import VideoShowcaseSection from '@/components/homepage/VideoShowcaseSection';
import HeroContentSection from '@/components/homepage/HeroContentSection';
import AboutSection from '@/components/homepage/AboutSection';
import DevelopmentJournal from '@/components/homepage/DevelopmentJournal';
import ArchitectureSection from '@/components/homepage/ArchitectureSection';
import StatsSection from '@/components/homepage/StatsSection';
import ContactSection from '@/components/homepage/ContactSection';
import Footer from '@/components/homepage/Footer';
import { SectionTracker } from '@/components/homepage/SectionTracker';
import { BounceTracker } from '@/components/homepage/BounceTracker';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

const HomePage = () => {
  const { trackPageView } = useHomepageAnalytics();

  // Track page view when component mounts
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // SEO structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Grace OS",
    "description": "Complete hospitality management system for restaurants, built through human-AI collaboration. Features real-time bookings, table management, analytics, and secure payment processing.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "GBP"
    },
    "creator": {
      "@type": "Organization",
      "name": "Grace OS",
      "url": "https://grace-os.co.uk"
    }
  };

  return (
    <>
      <Helmet>
        <title>Grace OS - Human-AI Hospitality Management System | Restaurant Booking Software</title>
        <meta 
          name="description" 
          content="Grace OS is a comprehensive restaurant management system built through human-AI collaboration. Features real-time table bookings, guest management, analytics, and secure payments. Built by hospitality experts." 
        />
        <meta 
          name="keywords" 
          content="restaurant management software, table booking system, hospitality management, AI collaboration, venue management, restaurant POS, booking software, Grace OS" 
        />
        <meta name="author" content="Grace OS Team" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Grace OS - Human-AI Hospitality Management System" />
        <meta property="og:description" content="Complete restaurant management system built through human-AI collaboration. Real-time bookings, analytics, and secure payments." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://grace-os.co.uk" />
        <meta property="og:site_name" content="Grace OS" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Grace OS - Human-AI Hospitality Management System" />
        <meta name="twitter:description" content="Complete restaurant management system built through human-AI collaboration. Real-time bookings, analytics, and secure payments." />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://grace-os.co.uk" />
        
        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Performance hints */}
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://img.youtube.com" />
      </Helmet>
      
      <BounceTracker />
      
      <div className="min-h-screen bg-gradient-to-br from-grace-background to-grace-light dark:from-gray-900 dark:to-gray-800">
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-grace-primary text-white px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>
        
        <Header />
        <main id="main-content">
          <SectionTracker sectionName="hero">
            <HeroSection />
          </SectionTracker>
          
          <SectionTracker sectionName="video_showcase">
            <VideoShowcaseSection />
          </SectionTracker>
          
          <SectionTracker sectionName="hero_content">
            <HeroContentSection />
          </SectionTracker>
          
          <SectionTracker sectionName="about">
            <AboutSection />
          </SectionTracker>
          
          <SectionTracker sectionName="development_journal">
            <DevelopmentJournal />
          </SectionTracker>
          
          <SectionTracker sectionName="architecture">
            <ArchitectureSection />
          </SectionTracker>
          
          <SectionTracker sectionName="stats">
            <StatsSection />
          </SectionTracker>
          
          <SectionTracker sectionName="contact">
            <ContactSection />
          </SectionTracker>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default HomePage;
