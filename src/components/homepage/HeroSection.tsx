
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 py-12 sm:py-16 text-center">
      <div className="mb-6 sm:mb-8">
        <h1 className="grace-logo text-4xl sm:text-6xl md:text-7xl font-bold text-grace-primary mb-2">
          Grace OS
        </h1>
        <h2 className="text-lg sm:text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300">
          A Human-AI Hospitality Journey
        </h2>
      </div>
      <div className="flex justify-center mb-6 sm:mb-8">
        <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3">
          <a href="#journal">View Latest Updates</a>
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
